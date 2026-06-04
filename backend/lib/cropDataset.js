import ee from '@google/earthengine';
import { buildMonthGrid } from './monthSeries.js';

const S2_COLLECTION = 'COPERNICUS/S2_SR';
const ERA5_COLLECTION = 'ECMWF/ERA5_LAND/DAILY_AGGR';
const ERA5_SCALE_METERS = 11132;
const NDVI_SCALE_METERS = 10;
const KELVIN_TO_CELSIUS = 273.15;
const METERS_TO_MM = 1000;

/**
 * Classify crop health from mean regional NDVI (Sentinel-2 derived).
 */
export function classifyCropStatus(ndvi) {
  if (ndvi == null || Number.isNaN(ndvi)) return null;
  if (ndvi > 0.6) return 'Healthy';
  if (ndvi >= 0.3) return 'Moderate';
  return 'Unhealthy';
}

export function monthFromDate(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`).getUTCMonth() + 1;
}

function round(value, decimals) {
  if (value == null || Number.isNaN(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Promisify Earth Engine getInfo for parallel evaluation.
 */
export function evaluate(eeObject) {
  return new Promise((resolve, reject) => {
    eeObject.getInfo((result) => {
      if (result?.error) {
        reject(new Error(result.error));
        return;
      }
      resolve(result);
    });
  });
}

export function parseQueryGeometry(query) {
  const { lat, lng, buffer } = query;
  if (!lat || !lng) {
    return { error: 'Latitude and Longitude are required' };
  }
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    return { error: 'Latitude and Longitude must be valid numbers' };
  }
  if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
    return { error: 'Latitude or Longitude out of valid range' };
  }
  const bufferRadius = parseInt(buffer, 10) || 1000;
  const point = ee.Geometry.Point([lngNum, latNum]);
  const area = point.buffer(bufferRadius);
  return { area, bufferRadius, latNum, lngNum };
}

export function parseDateRange(query) {
  const start = query.startDate || '2023-01-01';
  const end = query.endDate || '2024-01-01';
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return { error: 'startDate and endDate must be valid ISO dates (YYYY-MM-DD)' };
  }
  if (startMs >= endMs) {
    return { error: 'startDate must be before endDate' };
  }
  return { start, end };
}

/**
 * Sentinel-2 SR: cloud-filtered images → per-image mean NDVI over the AOI.
 * B8 (NIR) and B4 (red) normalized difference, scale 10 m.
 */
export function buildNdviFeatureCollection(area, start, end) {
  const collection = ee
    .ImageCollection(S2_COLLECTION)
    .filterBounds(area)
    .filterDate(start, end)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20));

  return collection.map((img) => {
    const ndvi = img.normalizedDifference(['B8', 'B4']).rename('ndvi');
    const stats = ndvi.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: area,
      scale: NDVI_SCALE_METERS,
      maxPixels: 1e9,
    });
    return ee.Feature(null, {
      date: img.date().format('YYYY-MM-dd'),
      ndvi: stats.get('ndvi'),
    });
  });
}

/**
 * ERA5-Land monthly aggregates (one GEE feature per month).
 * Use for long ranges (2010+) — daily FC would return thousands of features and fail silently.
 */
export function buildMonthlyWeatherFeatureCollection(area, start, end) {
  const rangeStart = ee.Date(start);
  const monthCount = buildMonthGrid(start, end).length;
  const indices = ee.List.sequence(0, monthCount - 1);

  const features = indices.map((index) => {
    const monthStart = rangeStart.advance(index, 'month');
    const monthEnd = monthStart.advance(1, 'month');

    const daily = ee
      .ImageCollection(ERA5_COLLECTION)
      .filterBounds(area)
      .filterDate(monthStart, monthEnd);

    const temperatureC = daily
      .select('temperature_2m')
      .mean()
      .subtract(KELVIN_TO_CELSIUS)
      .rename('temperature');

    const rainfallMm = daily
      .select('total_precipitation_sum')
      .sum()
      .multiply(METERS_TO_MM)
      .rename('rainfall');

    const bands = temperatureC.addBands(rainfallMm);

    const stats = bands.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: area,
      scale: ERA5_SCALE_METERS,
      maxPixels: 1e9,
    });

    return ee.Feature(null, {
      date: monthStart.format('YYYY-MM'),
      temperature: stats.get('temperature'),
      rainfall: stats.get('rainfall'),
    });
  });

  return ee.FeatureCollection(features);
}

export function weatherMonthsFromFeatures(fcResult) {
  if (!fcResult?.features?.length) return [];

  return fcResult.features
    .map((f) => ({
      date: f.properties.date,
      temperature: f.properties.temperature,
      rainfall: f.properties.rainfall,
    }))
    .filter((r) => r.date != null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * ERA5-Land daily aggregates: mean 2 m temperature (K→°C) and total precip (m→mm).
 * One feature per calendar day — only for short date ranges.
 */
export function buildWeatherFeatureCollection(area, start, end) {
  const collection = ee
    .ImageCollection(ERA5_COLLECTION)
    .filterBounds(area)
    .filterDate(start, end);

  return collection.map((img) => {
    const temperatureC = img.select('temperature_2m').subtract(KELVIN_TO_CELSIUS);
    const rainfallMm = img.select('total_precipitation_sum').multiply(METERS_TO_MM);
    const bands = temperatureC.rename('temperature').addBands(rainfallMm.rename('rainfall'));

    const stats = bands.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: area,
      scale: ERA5_SCALE_METERS,
      maxPixels: 1e9,
    });

    return ee.Feature(null, {
      date: img.date().format('YYYY-MM-dd'),
      temperature: stats.get('temperature'),
      rainfall: stats.get('rainfall'),
    });
  });
}

/**
 * Multiple S2 scenes on the same day → single mean NDVI for that date.
 */
export function aggregateNdviByDate(featureCollectionResult) {
  if (!featureCollectionResult?.features?.length) return [];

  const byDate = new Map();
  for (const f of featureCollectionResult.features) {
    const { date, ndvi } = f.properties;
    if (date == null || ndvi == null) continue;
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push(ndvi);
  }

  return [...byDate.entries()]
    .map(([date, values]) => ({
      date,
      ndvi: values.reduce((a, b) => a + b, 0) / values.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function weatherRowsFromFeatures(featureCollectionResult) {
  if (!featureCollectionResult?.features?.length) return [];

  return featureCollectionResult.features
    .map((f) => ({
      date: f.properties.date,
      temperature: f.properties.temperature,
      rainfall: f.properties.rainfall,
    }))
    .filter((r) => r.date != null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Join NDVI (sparse S2 dates) with ERA5 (daily) on matching calendar dates.
 */
export function mergeCropDataset(ndviRows, weatherRows) {
  const weatherByDate = new Map(weatherRows.map((r) => [r.date, r]));

  return ndviRows
    .map((row) => {
      const weather = weatherByDate.get(row.date);
      const ndvi = round(row.ndvi, 4);
      const temperature =
        weather?.temperature != null ? round(weather.temperature, 1) : null;
      const rainfall = weather?.rainfall != null ? round(weather.rainfall, 1) : null;

      return {
        date: row.date,
        ndvi,
        temperature,
        rainfall,
        month: monthFromDate(row.date),
        status: classifyCropStatus(ndvi),
      };
    })
    .filter((row) => row.ndvi != null && row.status != null);
}

/**
 * Rows shaped for RandomForest CSV training (includes month feature).
 */
export function toMlDatasetRows(mergedRows) {
  return mergedRows.map(({ date, ndvi, temperature, rainfall, month, status }) => ({
    date,
    ndvi,
    temperature,
    rainfall,
    month,
    status,
  }));
}

/**
 * Run NDVI + weather GEE queries in parallel, then merge by date.
 */
export async function fetchCropDataset({ area, start, end }) {
  const ndviFc = buildNdviFeatureCollection(area, start, end);
  const weatherFc = buildWeatherFeatureCollection(area, start, end);

  const [ndviRaw, weatherRaw] = await Promise.all([
    evaluate(ndviFc),
    evaluate(weatherFc),
  ]);

  const ndviRows = aggregateNdviByDate(ndviRaw);
  const weatherRows = weatherRowsFromFeatures(weatherRaw);
  const merged = mergeCropDataset(ndviRows, weatherRows);

  return { merged, ndviRows, weatherRows };
}

export function toApiResponseRows(mergedRows) {
  return mergedRows.map(({ date, ndvi, temperature, rainfall, status }) => ({
    date,
    ndvi,
    temperature,
    rainfall,
    status,
  }));
}

export const CSV_HEADERS = ['date', 'ndvi', 'temperature', 'rainfall', 'month', 'status'];

export function rowsToCsv(mergedRows) {
  const header = CSV_HEADERS.join(',');
  const lines = mergedRows.map((row) =>
    CSV_HEADERS.map((key) => {
      const val = row[key];
      return val === null || val === undefined ? '' : String(val);
    }).join(',')
  );
  return [header, ...lines].join('\n');
}
