import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  initializeGee,
  isGeeReady,
  buildGeeNotReadyPayload,
  getGeeStatus,
} from './lib/geeAuth.js';
import { parseQueryGeometry, parseDateRange } from './lib/cropDataset.js';
import { fetchNdviTimeSeries } from './lib/ndviEndpoint.js';
import {
  fetchMultiLocationForecastDataset,
  forecastRowsToCsv,
  validateForecastRequest,
} from './lib/forecastDataset.js';
import {
  fetchExtendedForecastDataset,
  extendedRowsToCsv,
  validateExtendedForecastRequest,
} from './lib/extendedForecastDataset.js';
import {
  fetchCropDataset,
  toApiResponseRows,
  toMlDatasetRows,
  rowsToCsv,
} from './lib/cropDataset.js';
import {
  getDashboardForecast,
  validateDashboardRequest,
  listDashboardLocations,
} from './lib/dashboardForecast.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

console.log('--- GEE AUTHENTICATION START ---');
initializeGee().then((geeState) => {
  if (!geeState.ready) {
    console.error('[GEE] Server will start but GEE API routes will return 503 until credentials are fixed.');
  }
});

function geeNotReady(res) {
  return res.status(503).json(buildGeeNotReadyPayload());
}

/** Diagnostic: credential source and init state (no secrets returned). */
app.get('/api/gee-status', (_req, res) => {
  const s = getGeeStatus();
  res.status(s.ready ? 200 : 503).json({
    ready: s.ready,
    status: s.status,
    credentialSource: s.credentialSource,
    serviceAccountEmail: s.serviceAccountEmail,
    error: s.error,
    hints: s.hints,
  });
});

/**
 * Dashboard endpoint — unchanged contract: per-scene date, ndvi, status only.
 */
app.get('/api/ndvi', async (req, res) => {
  if (!isGeeReady()) return geeNotReady(res);

  const { lat, lng, regionName, startDate, endDate, buffer } = req.query;

  const geometry = parseQueryGeometry(req.query);
  if (geometry.error) {
    return res.status(400).json({ error: geometry.error });
  }

  const dates = parseDateRange(req.query);
  if (dates.error) {
    return res.status(400).json({ error: dates.error });
  }

  const start = dates.start;
  const end = dates.end;
  const { area, bufferRadius } = geometry;

  console.log(
    `[GEE] NDVI: ${regionName || 'Custom'} [${lat}, ${lng}] ` +
      `Area: ${bufferRadius}m Dates: ${start} → ${end}`
  );

  try {
    const results = await fetchNdviTimeSeries({ area, start, end });
    return res.json(results);
  } catch (error) {
    console.error('GEE Processing Error:', error);
    return res.status(500).json({
      error: 'Internal Server Error during GEE processing.',
      details: error.message,
    });
  }
});

/**
 * Monthly ML dataset: all default locations, continuous calendar months, interpolated NDVI.
 * GET /api/export-forecast-dataset?format=csv → forecast_dataset.csv
 * Optional: locations=[{name,lat,lng},...]  or  lat/lng for single site
 */
app.get('/api/export-forecast-dataset', async (req, res) => {
  if (!isGeeReady()) return geeNotReady(res);

  const validated = validateForecastRequest(req.query);
  if (validated.error) {
    return res.status(validated.status).json({ error: validated.error });
  }

  const { locations, bufferRadius, start, end } = validated;

  console.log(
    `[GEE] Forecast export: ${locations.length} location(s), ` +
      `${start} → ${end}, buffer=${bufferRadius}m`
  );

  try {
    const result = await fetchMultiLocationForecastDataset({
      locations,
      start,
      end,
      bufferRadius,
    });

    if (result.rows.length === 0) {
      return res.status(422).json({
        error: 'No training rows generated. Check date range and GEE connectivity.',
        count: 0,
        data: [],
        quality: result.quality,
      });
    }

    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="forecast_dataset.csv"'
      );
      return res.send(forecastRowsToCsv(result.rows));
    }

    return res.json({
      count: result.rows.length,
      data: result.rows,
      quality: result.quality,
      perLocation: result.perLocation,
    });
  } catch (error) {
    console.error('Forecast dataset error:', error);
    return res.status(500).json({
      error: 'Internal Server Error during forecast dataset generation.',
      details: error.message,
    });
  }
});

/**
 * Data quality report for the forecast ML pipeline (no CSV body).
 */
app.get('/api/dataset-quality', async (req, res) => {
  if (!isGeeReady()) return geeNotReady(res);

  const validated = validateForecastRequest(req.query);
  if (validated.error) {
    return res.status(validated.status).json({ error: validated.error });
  }

  const { locations, bufferRadius, start, end } = validated;

  try {
    const result = await fetchMultiLocationForecastDataset({
      locations,
      start,
      end,
      bufferRadius,
    });

    return res.json(result.quality);
  } catch (error) {
    console.error('Dataset quality error:', error);
    return res.status(500).json({
      error: 'Internal Server Error during quality analysis.',
      details: error.message,
    });
  }
});

/**
 * Extended ML dataset: 20 locations, 2010-2025, multi-sensor NDVI fusion.
 */
app.get('/api/export-forecast-dataset-extended', async (req, res) => {
  if (!isGeeReady()) return geeNotReady(res);

  const validated = validateExtendedForecastRequest(req.query);
  if (validated.error) {
    return res.status(validated.status).json({ error: validated.error });
  }

  const { locations, bufferRadius, start, end } = validated;

  console.log(
    `[GEE] Extended export: ${locations.length} locations, ${start} -> ${end}`
  );

  try {
    const result = await fetchExtendedForecastDataset({
      locations,
      start,
      end,
      bufferRadius,
    });

    if (result.rows.length === 0) {
      return res.status(422).json({
        error: 'No training rows generated.',
        quality: result.quality,
      });
    }

    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="forecast_dataset_extended.csv"'
      );
      return res.send(extendedRowsToCsv(result.rows));
    }

    return res.json({
      count: result.rows.length,
      data: result.rows,
      quality: result.quality,
    });
  } catch (error) {
    console.error('Extended forecast error:', error);
    return res.status(500).json({
      error: 'Internal Server Error during extended dataset generation.',
      details: error.message,
    });
  }
});

app.get('/api/dataset-quality-extended', async (req, res) => {
  if (!isGeeReady()) return geeNotReady(res);

  const validated = validateExtendedForecastRequest(req.query);
  if (validated.error) {
    return res.status(validated.status).json({ error: validated.error });
  }

  try {
    const result = await fetchExtendedForecastDataset({
      locations: validated.locations,
      start: validated.start,
      end: validated.end,
      bufferRadius: validated.bufferRadius,
    });
    return res.json(result.quality);
  } catch (error) {
    console.error('Extended quality error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/** Agricultural dashboard: historical NDVI/rain/temp + ML next-month NDVI only. */
app.get('/api/dashboard-forecast', async (req, res) => {
  const validated = validateDashboardRequest(req.query);
  if (validated.error) {
    return res.status(validated.status).json({ error: validated.error });
  }

  try {
    const result = await getDashboardForecast(validated);
    if (result.error) {
      return res.status(422).json({ error: result.error });
    }
    return res.json(result);
  } catch (error) {
    console.error('Dashboard forecast error:', error);
    return res.status(500).json({
      error: 'Failed to build dashboard forecast.',
      details: error.message,
    });
  }
});

app.get('/api/dashboard-locations', (_req, res) => {
  res.json({ locations: listDashboardLocations() });
});

async function handleCropDatasetRequest(req, res, { includeCsv, includeSaveHint }) {
  if (!isGeeReady()) return geeNotReady(res);

  const geometry = parseQueryGeometry(req.query);
  if (geometry.error) {
    return res.status(400).json({ error: geometry.error });
  }

  const dates = parseDateRange(req.query);
  if (dates.error) {
    return res.status(400).json({ error: dates.error });
  }

  const { lat, lng, regionName, startDate, endDate, buffer } = req.query;
  const start = dates.start;
  const end = dates.end;
  const { area, bufferRadius } = geometry;

  console.log(
    `[GEE] Dataset: ${regionName || 'Custom'} [${lat}, ${lng}] ` +
      `Area: ${bufferRadius}m Dates: ${start} → ${end}`
  );

  try {
    const { merged } = await fetchCropDataset({ area, start, end });
    const apiRows = toApiResponseRows(merged);
    const mlRows = toMlDatasetRows(merged);

    const body = { data: apiRows, count: apiRows.length };

    if (includeCsv) {
      body.mlData = mlRows;
      body.csv = rowsToCsv(mlRows);
      body.csvHeaders = ['date', 'ndvi', 'temperature', 'rainfall', 'month', 'status'];
    }

    if (includeSaveHint) {
      body.saveToCsv = {
        description: 'Run from the backend folder to write dataset.csv via Node.js',
        command: 'node scripts/exportDatasetToCsv.js',
        example:
          `node scripts/exportDatasetToCsv.js --lat ${lat} --lng ${lng} --start ${startDate || start} --end ${endDate || end} --buffer ${buffer || bufferRadius} --out ../dataset.csv`,
      };
    }

    if (req.query.download === 'true' && includeCsv) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="dataset.csv"');
      return res.send(body.csv);
    }

    if (req.query.format === 'csv' && includeCsv) {
      res.setHeader('Content-Type', 'text/csv');
      return res.send(body.csv);
    }

    return res.json(includeCsv ? body : apiRows);
  } catch (error) {
    console.error('GEE Processing Error:', error);
    return res.status(500).json({
      error: 'Internal Server Error during GEE processing.',
      details: error.message,
    });
  }
}

app.get('/api/export-dataset', (req, res) => {
  handleCropDatasetRequest(req, res, { includeCsv: true, includeSaveHint: true });
});

app.post('/api/generate-report', async (req, res) => {
  try {
    const { stats, selectedRegions, data } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not set in backend/.env' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `You are an expert agronomist AI analyzing satellite crop data (NDVI).
    The user is monitoring the following regions: ${selectedRegions.join(', ')}.
    
    Overall stats for the primary region (${selectedRegions[0]}):
    - Average NDVI: ${stats.avg}
    - Max NDVI: ${stats.max}
    - Min NDVI: ${stats.min}
    - Status: ${stats.currentStatus}
    
    Recent data points (last 5 readings): 
    ${JSON.stringify((data || []).slice(-5))}
    
    Write a short, highly professional 2-paragraph report analyzing this data. 
    1. First paragraph: Summarize the crop health and any anomalies or trends.
    2. Second paragraph: Provide actionable recommendations (e.g., irrigation, field inspection) based on the data.
    Do not use markdown formatting like ** or *, just plain text paragraphs. Make it sound very scientific and authoritative.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    res.json({ report: responseText });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: 'Failed to generate AI report.' });
  }
});

app.listen(PORT, () => {
  console.log(`--- SATELLITE BACKEND RUNNING ON PORT ${PORT} ---`);
  console.log(`Endpoints: 
  - GET http://localhost:${PORT}/api/gee-status
  - GET http://localhost:${PORT}/api/ndvi
  - GET http://localhost:${PORT}/api/export-forecast-dataset
  - GET http://localhost:${PORT}/api/export-forecast-dataset?format=csv
  - GET http://localhost:${PORT}/api/export-forecast-dataset-extended?format=csv
  - GET http://localhost:${PORT}/api/dataset-quality-extended
  - GET http://localhost:${PORT}/api/dashboard-forecast
  - GET http://localhost:${PORT}/api/dashboard-locations
  - GET http://localhost:${PORT}/api/export-dataset
  - POST http://localhost:${PORT}/api/generate-report
  - npm run check-gee  (credential diagnostic)`);
});
