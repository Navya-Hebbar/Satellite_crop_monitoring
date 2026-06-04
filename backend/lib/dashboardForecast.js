import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { EXTENDED_FORECAST_LOCATIONS } from './forecastLocations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..', '..');
const EXTENDED_CSV = path.join(PROJECT_ROOT, 'forecast_dataset_extended.csv');
const ML_DIR = path.join(PROJECT_ROOT, 'ml');

const LOCATION_MAP = new Map(
  EXTENDED_FORECAST_LOCATIONS.map((l) => [l.name.toLowerCase(), l])
);

function resolveLocation(name) {
  if (!name) return { error: 'location query parameter is required' };
  const loc = LOCATION_MAP.get(name.trim().toLowerCase());
  if (!loc) {
    const known = EXTENDED_FORECAST_LOCATIONS.map((l) => l.name).join(', ');
    return { error: `Unknown location "${name}". Known: ${known}` };
  }
  return { location: loc };
}

function parseDateRange(startDate, endDate) {
  const start = startDate || '2010-01-01';
  const end = endDate || new Date().toISOString().slice(0, 10);
  if (start >= end) {
    return { error: 'startDate must be before endDate' };
  }
  return { start, end };
}

function yearMonthToComparable(ym) {
  return ym;
}

function addOneMonth(yearMonth) {
  const [y, m] = yearMonth.split('-').map(Number);
  let month = m + 1;
  let year = y;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

function loadCsvRows() {
  if (!fs.existsSync(EXTENDED_CSV)) {
    return null;
  }
  const text = fs.readFileSync(EXTENDED_CSV, 'utf8');
  const lines = text.trim().split('\n');
  const header = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const parts = line.split(',');
    const row = {};
    header.forEach((h, i) => {
      row[h] = parts[i] === '' ? null : parts[i];
    });
    return row;
  });
}

function filterLocationHistory(allRows, locationName, startYm, endYm) {
  const loc = locationName.toLowerCase();
  return allRows
    .filter((r) => r.location?.toLowerCase() === loc)
    .filter((r) => {
      const d = r.date;
      return d >= startYm.slice(0, 7) && d <= endYm.slice(0, 7);
    })
    .map((r) => ({
      date: r.date,
      month: parseInt(r.month, 10),
      ndvi: r.ndvi != null ? parseFloat(r.ndvi) : null,
      rainfall: r.rainfall != null ? parseFloat(r.rainfall) : null,
      temperature: r.temperature != null ? parseFloat(r.temperature) : null,
      prev_ndvi: r.prev_ndvi != null ? parseFloat(r.prev_ndvi) : null,
      ndvi_change: r.ndvi_change != null ? parseFloat(r.ndvi_change) : null,
    }))
    .filter((r) => r.ndvi != null && !Number.isNaN(r.ndvi))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function runPythonPredict(location, history) {
  return new Promise((resolve, reject) => {
    const script = path.join(ML_DIR, 'predict_from_history.py');
    const pythonCmd = process.env.PYTHON_PATH || 'python';
    const child = spawn(pythonCmd, [script], {
      cwd: ML_DIR,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      if (code !== 0) {
        try {
          const errJson = JSON.parse(stderr.trim());
          reject(new Error(errJson.error || stderr));
        } catch {
          reject(new Error(stderr || stdout || `Python exited ${code}`));
        }
        return;
      }
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch {
        reject(new Error(`Invalid JSON from predictor: ${stdout}`));
      }
    });

    child.stdin.write(JSON.stringify({ location, history }));
    child.stdin.end();
  });
}

function deriveStatus(changePercent) {
  if (changePercent > 2) return 'Improving';
  if (changePercent < -2) return 'Declining';
  return 'Stable';
}

function buildInsights(location, history, prediction, avgRain, avgTemp) {
  const ndvis = history.map((h) => h.ndvi);
  const trend =
    ndvis.length >= 2
      ? ndvis[ndvis.length - 1] - ndvis[ndvis.length - 2]
      : 0;
  const trendWord = trend > 0.02 ? 'rising' : trend < -0.02 ? 'falling' : 'stable';

  return {
    ndvi_trend: `Historical NDVI in ${location} is ${trendWord} over the selected window (latest: ${prediction.current_ndvi}).`,
    predicted_movement: `The Random Forest model forecasts next-month NDVI at ${prediction.predicted_ndvi} (${prediction.change_percent > 0 ? '+' : ''}${prediction.change_percent}% vs current).`,
    rainfall_note: `Observed mean monthly rainfall: ${avgRain} mm (historical only, not forecast).`,
    temperature_note: `Observed mean monthly temperature: ${avgTemp} °C (historical only, not forecast).`,
    crop_health: interpretHealth(prediction.predicted_ndvi, prediction.status),
  };
}

function interpretHealth(ndvi, status) {
  if (ndvi > 0.6) return 'Predicted vegetation index suggests vigorous crop canopy (healthy).';
  if (ndvi >= 0.3) return 'Predicted NDVI indicates moderate vegetation vigor — monitor for stress.';
  return 'Predicted NDVI is low — possible crop stress, cloud gaps, or off-season bare soil.';
}

/**
 * Dashboard forecast: historical series + ML next-month NDVI (rain/temp historical only).
 */
export async function getDashboardForecast({ locationName, startDate, endDate }) {
  const allRows = loadCsvRows();
  if (!allRows) {
    return {
      error: 'forecast_dataset_extended.csv not found. Run npm run export-forecast-extended in backend/.',
    };
  }

  const startYm = startDate.slice(0, 7);
  let endYm = endDate.slice(0, 7);

  const locationRows = allRows.filter(
    (r) => r.location?.toLowerCase() === locationName.toLowerCase()
  );
  const latestYm = locationRows
    .map((r) => r.date)
    .filter(Boolean)
    .sort()
    .pop();

  if (!latestYm) {
    return { error: `No forecast data for location "${locationName}".` };
  }

  if (endYm > latestYm) {
    endYm = latestYm;
  }
  if (startYm > endYm) {
    return {
      error: `Selected range starts after latest available data (${latestYm}).`,
    };
  }

  // Full prefix through endYm so lags/rolling match training (not sliced at startYm).
  const mlHistory = filterLocationHistory(allRows, locationName, '2010-01', endYm);
  const displayHistory = mlHistory.filter((r) => r.date >= startYm);

  if (displayHistory.length === 0) {
    return { error: 'No data in the selected date range for this location.' };
  }

  if (mlHistory.length < 13) {
    return {
      error: `Insufficient history (${mlHistory.length} months). Select a longer date range (need 13+ months).`,
    };
  }

  const mlInput = mlHistory.map((r) => ({
    date: r.date,
    month: r.month,
    ndvi: r.ndvi,
    rainfall: r.rainfall ?? 0,
    temperature: r.temperature ?? 22,
    prev_ndvi: r.prev_ndvi,
    ndvi_change: r.ndvi_change,
  }));

  let mlResult;
  try {
    mlResult = await runPythonPredict(locationName, mlInput);
  } catch (err) {
    return { error: `ML prediction failed: ${err.message}` };
  }

  const history = displayHistory;
  const last = displayHistory[displayHistory.length - 1];
  const currentNdvi = round(last.ndvi, 4);
  const predictedNdvi = mlResult.predicted_ndvi;
  const changePercent =
    currentNdvi !== 0
      ? round(((predictedNdvi - currentNdvi) / currentNdvi) * 100, 1)
      : 0;

  const nextDate = addOneMonth(last.date);
  const status = deriveStatus(changePercent);

  const rainfallVals = history.map((h) => h.rainfall).filter((v) => v != null);
  const tempVals = history.map((h) => h.temperature).filter((v) => v != null);
  const avgRain = rainfallVals.length
    ? round(rainfallVals.reduce((a, b) => a + b, 0) / rainfallVals.length, 1)
    : null;
  const avgTemp = tempVals.length
    ? round(tempVals.reduce((a, b) => a + b, 0) / tempVals.length, 1)
    : null;

  const prediction = {
    date: nextDate,
    predicted_ndvi: predictedNdvi,
    current_ndvi: currentNdvi,
    change_percent: changePercent,
    status,
    model_used: mlResult.model_used,
  };

  return {
    ndvi: history.map((h) => ({ date: h.date, value: round(h.ndvi, 4) })),
    rainfall: history
      .filter((h) => h.rainfall != null)
      .map((h) => ({ date: h.date, value: round(h.rainfall, 1) })),
    temperature: history
      .filter((h) => h.temperature != null)
      .map((h) => ({ date: h.date, value: round(h.temperature, 1) })),
    prediction,
    summary: {
      current_ndvi: currentNdvi,
      predicted_ndvi: predictedNdvi,
      change_percent: changePercent,
      average_rainfall: avgRain,
      average_temperature: avgTemp,
    },
    insights: buildInsights(locationName, history, prediction, avgRain, avgTemp),
    forecast_start: last.date,
  };
}

function round(v, d) {
  if (v == null || Number.isNaN(v)) return null;
  const f = 10 ** d;
  return Math.round(v * f) / f;
}

export function validateDashboardRequest(query) {
  const loc = resolveLocation(query.location);
  if (loc.error) return { error: loc.error, status: 400 };

  const dates = parseDateRange(query.startDate, query.endDate);
  if (dates.error) return { error: dates.error, status: 400 };

  return {
    locationName: loc.location.name,
    startDate: dates.start,
    endDate: dates.end,
  };
}

export function listDashboardLocations() {
  return EXTENDED_FORECAST_LOCATIONS.map((l) => ({
    name: l.name,
    latitude: l.lat,
    longitude: l.lng,
  }));
}
