import ee from '@google/earthengine';
import {
  evaluate,
  parseDateRange,
  buildNdviFeatureCollection,
  buildWeatherFeatureCollection,
  aggregateNdviByDate,
  weatherRowsFromFeatures,
} from './cropDataset.js';
import { buildMonthGrid, monthNumberFromYearMonth, yearMonthKey } from './monthSeries.js';
import {
  interpolateMonthlyNdvi,
  fillWeatherOnMonthGrid,
} from './ndviInterpolation.js';
import { parseForecastLocations, DEFAULT_FORECAST_LOCATIONS } from './forecastLocations.js';

export const FORECAST_CSV_HEADERS = [
  'location',
  'date',
  'month',
  'ndvi',
  'prev_ndvi',
  'ndvi_change',
  'temperature',
  'rainfall',
  'next_ndvi',
];

export { DEFAULT_FORECAST_LOCATIONS, parseForecastLocations };

function round(value, decimals) {
  if (value == null || Number.isNaN(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function aggregateNdviByMonth(dailyNdviRows) {
  const byMonth = new Map();

  for (const row of dailyNdviRows) {
    if (!row.date || row.ndvi == null || Number.isNaN(row.ndvi)) continue;
    const key = yearMonthKey(row.date);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key).push(row.ndvi);
  }

  return [...byMonth.entries()]
    .map(([date, values]) => ({
      date,
      ndvi: values.reduce((a, b) => a + b, 0) / values.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function aggregateWeatherByMonth(dailyWeatherRows) {
  const byMonth = new Map();

  for (const row of dailyWeatherRows) {
    if (!row.date) continue;
    const key = yearMonthKey(row.date);
    if (!byMonth.has(key)) {
      byMonth.set(key, { temperatures: [], rainfall: 0, hasRainfall: false });
    }
    const bucket = byMonth.get(key);
    if (row.temperature != null && !Number.isNaN(row.temperature)) {
      bucket.temperatures.push(row.temperature);
    }
    if (row.rainfall != null && !Number.isNaN(row.rainfall)) {
      bucket.rainfall += row.rainfall;
      bucket.hasRainfall = true;
    }
  }

  return [...byMonth.entries()]
    .map(([date, bucket]) => ({
      date,
      temperature:
        bucket.temperatures.length > 0
          ? bucket.temperatures.reduce((a, b) => a + b, 0) / bucket.temperatures.length
          : null,
      rainfall: bucket.hasRainfall ? bucket.rainfall : null,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Build a complete monthly series on the calendar grid, interpolate NDVI gaps,
 * attach weather, prev_ndvi, ndvi_change, and calendar next_ndvi.
 */
export function buildLocationMonthlySeries({
  locationName,
  monthGrid,
  observedNdviMonths,
  weatherMonths,
}) {
  const observedByMonth = new Map(
    observedNdviMonths.map((r) => [r.date, r.ndvi])
  );

  const ndviResult = interpolateMonthlyNdvi(monthGrid, observedByMonth);
  const weatherByMonth = new Map(weatherMonths.map((r) => [r.date, r]));
  const weatherFilled = fillWeatherOnMonthGrid(monthGrid, weatherByMonth);

  const completeRows = monthGrid.map((date, i) => {
    const ndviEntry = ndviResult.series[i];
    const weather = weatherFilled[i];
    return {
      location: locationName,
      date,
      month: monthNumberFromYearMonth(date),
      ndvi: ndviEntry.ndvi != null ? round(ndviEntry.ndvi, 4) : null,
      ndviObserved: ndviEntry.observed,
      ndviInterpolated: ndviEntry.interpolated,
      temperature: weather.temperature != null ? round(weather.temperature, 1) : null,
      rainfall: weather.rainfall != null ? round(weather.rainfall, 1) : null,
    };
  });

  const withPrev = completeRows.map((row, i) => {
    const prevNdvi = i > 0 ? completeRows[i - 1].ndvi : null;
    return {
      ...row,
      prev_ndvi: prevNdvi != null ? round(prevNdvi, 4) : null,
      ndvi_change:
        prevNdvi != null && row.ndvi != null ? round(row.ndvi - prevNdvi, 4) : null,
    };
  });

  const trainingRows = withPrev
    .slice(0, -1)
    .map((row, i) => ({
      location: row.location,
      date: row.date,
      month: row.month,
      ndvi: row.ndvi,
      prev_ndvi: row.prev_ndvi,
      ndvi_change: row.ndvi_change,
      temperature: row.temperature,
      rainfall: row.rainfall,
      next_ndvi: round(withPrev[i + 1].ndvi, 4),
    }))
    .filter((row) => row.ndvi != null && row.next_ndvi != null);

  return {
    completeRows: withPrev,
    trainingRows,
    stats: {
      location: locationName,
      expectedMonths: monthGrid.length,
      observedMonths: observedNdviMonths.length,
      missingBeforeInterpolation: ndviResult.missingBeforeFill.length,
      interpolatedMonths: ndviResult.interpolatedMonths.length,
      interpolatedMonthList: ndviResult.interpolatedMonths,
      missingMonthList: ndviResult.missingBeforeFill,
      trainingRows: trainingRows.length,
    },
  };
}

export async function fetchLocationRawData({ lat, lng, start, end, bufferRadius = 1000 }) {
  const area = ee.Geometry.Point([lng, lat]).buffer(bufferRadius);
  const ndviFc = buildNdviFeatureCollection(area, start, end);
  const weatherFc = buildWeatherFeatureCollection(area, start, end);

  const [ndviRaw, weatherRaw] = await Promise.all([
    evaluate(ndviFc),
    evaluate(weatherFc),
  ]);

  const dailyNdvi = aggregateNdviByDate(ndviRaw);
  const dailyWeather = weatherRowsFromFeatures(weatherRaw);

  return {
    observedNdviMonths: aggregateNdviByMonth(dailyNdvi),
    weatherMonths: aggregateWeatherByMonth(dailyWeather),
  };
}

export async function fetchLocationForecastDataset({
  name,
  lat,
  lng,
  start,
  end,
  bufferRadius,
  monthGrid,
}) {
  const grid = monthGrid || buildMonthGrid(start, end);
  const raw = await fetchLocationRawData({ lat, lng, start, end, bufferRadius });

  const built = buildLocationMonthlySeries({
    locationName: name,
    monthGrid: grid,
    observedNdviMonths: raw.observedNdviMonths,
    weatherMonths: raw.weatherMonths,
  });

  return {
    ...built,
    raw,
  };
}

export async function fetchMultiLocationForecastDataset({
  locations,
  start,
  end,
  bufferRadius = 1000,
}) {
  const monthGrid = buildMonthGrid(start, end);
  const expectedMonths = monthGrid.length;

  console.log(
    `[Forecast] Building dataset: ${locations.length} location(s), ` +
      `${expectedMonths} calendar months (${monthGrid[0]} → ${monthGrid[monthGrid.length - 1]})`
  );

  const perLocationResults = await Promise.all(
    locations.map(async (loc) => {
      console.log(`[Forecast] GEE fetch: ${loc.name} [${loc.lat}, ${loc.lng}]`);
      const result = await fetchLocationForecastDataset({
        name: loc.name,
        lat: loc.lat,
        lng: loc.lng,
        start,
        end,
        bufferRadius,
        monthGrid,
      });

      console.log(
        `[Forecast] ${loc.name}: observed=${result.stats.observedMonths}/${expectedMonths}, ` +
          `interpolated=${result.stats.interpolatedMonths}, training rows=${result.stats.trainingRows}`
      );

      return result;
    })
  );

  const allTrainingRows = perLocationResults.flatMap((r) => r.trainingRows);
  const quality = buildDatasetQualityReport({
    start,
    end,
    monthGrid,
    perLocationResults,
    allTrainingRows,
  });

  console.log(
    `[Forecast] Complete: ${allTrainingRows.length} total training rows ` +
      `(${locations.length} locations × ~${expectedMonths - 1} months)`
  );

  return {
    rows: allTrainingRows,
    quality,
    perLocation: perLocationResults.map((r) => ({
      location: r.stats.location,
      stats: r.stats,
      sample: r.trainingRows.slice(0, 2),
    })),
    monthGrid,
  };
}

export function buildDatasetQualityReport({
  start,
  end,
  monthGrid,
  perLocationResults,
  allTrainingRows,
}) {
  const rowKeys = allTrainingRows.map(
    (r) => `${r.location}|${r.date}|${r.ndvi}|${r.next_ndvi}`
  );
  const uniqueKeys = new Set(rowKeys);
  const duplicateRows = rowKeys.length - uniqueKeys.size;

  const missingMonths = perLocationResults.map((r) => ({
    location: r.stats.location,
    count: r.stats.missingBeforeInterpolation,
    months: r.stats.missingMonthList,
  }));

  const interpolatedMonths = perLocationResults.reduce(
    (sum, r) => sum + r.stats.interpolatedMonths,
    0
  );

  return {
    totalRows: allTrainingRows.length,
    missingMonths,
    interpolatedMonths,
    interpolationMethod:
      'linear between observed months; forward/backward fill at series edges',
    locations: perLocationResults.map((r) => r.stats.location),
    dateRange: { start, end, monthCount: monthGrid.length },
    expectedMonthsPerLocation: monthGrid.length,
    trainingRowsPerLocation: perLocationResults.map((r) => ({
      location: r.stats.location,
      rows: r.stats.trainingRows,
    })),
    duplicateRows,
    meetsMinimumRows: allTrainingRows.length >= 300,
    rowTarget: { minimum: 300, preferred: '500-1000' },
  };
}

export function forecastRowsToCsv(rows) {
  const header = FORECAST_CSV_HEADERS.join(',');
  const lines = rows.map((row) =>
    FORECAST_CSV_HEADERS.map((key) => {
      const val = row[key];
      return val === null || val === undefined ? '' : String(val);
    }).join(',')
  );
  return [header, ...lines].join('\n');
}

export function validateForecastRequest(query) {
  const dates = parseDateRange({
    startDate: query.startDate || '2018-01-01',
    endDate: query.endDate || '2024-01-01',
  });
  if (dates.error) {
    return { error: dates.error, status: 400 };
  }

  const locParsed = parseForecastLocations(query);
  if (locParsed.error) {
    return { error: locParsed.error, status: 400 };
  }

  const bufferRadius = parseInt(query.buffer, 10) || 1000;

  return {
    locations: locParsed.locations,
    bufferRadius,
    start: dates.start,
    end: dates.end,
  };
}
