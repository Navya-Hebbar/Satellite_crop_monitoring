/**
 * Multi-sensor NDVI fusion for continuous monthly crop monitoring (2010–2025).
 *
 * Sensor strategy (priority per calendar month):
 *   1. Sentinel-2  (COPERNICUS/S2_SR)     — Jun 2015+, 10 m, best quality
 *   2. Landsat 7/8/9 (Collection 2 SR)    — 2010+, 30 m, fills pre-S2 & cloudy gaps
 *   3. MODIS (MOD13Q1)                    — 2010+, 250 m, dense temporal baseline
 *
 * Normalization:
 *   - S2/Landsat: normalizedDifference(NIR, Red) → NDVI in [-1, 1]
 *   - MODIS NDVI band: scale factor 0.0001 (GEE standard for MOD13Q1)
 *   - No cross-sensor linear calibration; priority fusion picks one sensor per month
 *     to avoid blending incompatible distributions in the same training row.
 */
import ee from '@google/earthengine';
import { evaluate } from './cropDataset.js';
import { yearMonthKey } from './monthSeries.js';

const S2_COLLECTION = 'COPERNICUS/S2_SR_HARMONIZED';
const MODIS_COLLECTION = 'MODIS/061/MOD13Q1';
const L7 = 'LANDSAT/LE07/C02/T1_SR';
const L8 = 'LANDSAT/LC08/C02/T1_SR';
const L9 = 'LANDSAT/LC09/C02/T1_SR';

const S2_SCALE = 10;
const LANDSAT_SCALE = 30;
const MODIS_SCALE = 250;
const MODIS_NDVI_SCALE = 0.0001;

/** Sentinel-2 available from mid-2015 for operational crop monitoring. */
export const S2_EARLIEST = '2015-06-01';

function aggregateScenesToMonths(featureCollectionResult) {
  if (!featureCollectionResult?.features?.length) return [];

  const byMonth = new Map();
  for (const f of featureCollectionResult.features) {
    const { date, ndvi } = f.properties;
    if (date == null || ndvi == null || Number.isNaN(ndvi)) continue;
    const key = yearMonthKey(date);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key).push(ndvi);
  }

  return [...byMonth.entries()]
    .map(([date, values]) => ({
      date,
      ndvi: values.reduce((a, b) => a + b, 0) / values.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function maskL57Clouds(image) {
  const qa = image.select('QA_PIXEL');
  const cloud = qa.bitwiseAnd(1 << 3).eq(0);
  const shadow = qa.bitwiseAnd(1 << 4).eq(0);
  return image.updateMask(cloud.and(shadow));
}

function landsatNdviL57(image) {
  const scaled = image.select(['SR_B3', 'SR_B4']).multiply(0.0000275).add(-0.2);
  return scaled.normalizedDifference(['SR_B4', 'SR_B3']).rename('ndvi');
}

function landsatNdviL89(image) {
  const scaled = image.select(['SR_B4', 'SR_B5']).multiply(0.0000275).add(-0.2);
  return scaled.normalizedDifference(['SR_B5', 'SR_B4']).rename('ndvi');
}

/** ee.Date has no .max() in the Node client — compare ISO strings in JavaScript. */
function laterIsoDate(a, b) {
  return a >= b ? a : b;
}

export function buildS2NdviFeatureCollection(area, start, end) {
  const s2Start = laterIsoDate(start, S2_EARLIEST);
  const collection = ee
    .ImageCollection(S2_COLLECTION)
    .filterBounds(area)
    .filterDate(s2Start, end)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20));

  return collection.map((img) => {
    const ndvi = img.normalizedDifference(['B8', 'B4']).rename('ndvi');
    const stats = ndvi.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: area,
      scale: S2_SCALE,
      maxPixels: 1e9,
    });
    return ee.Feature(null, {
      date: img.date().format('YYYY-MM-dd'),
      ndvi: stats.get('ndvi'),
    });
  });
}

export function buildLandsatNdviFeatureCollection(area, start, end) {
  const mkCollection = (id, ndviFn) =>
    ee
      .ImageCollection(id)
      .filterBounds(area)
      .filterDate(start, end)
      .map(maskL57Clouds)
      .map(ndviFn);

  const merged = mkCollection(L7, landsatNdviL57)
    .merge(mkCollection(L8, landsatNdviL89))
    .merge(mkCollection(L9, landsatNdviL89));

  return merged.map((img) => {
    const stats = img.select('ndvi').reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: area,
      scale: LANDSAT_SCALE,
      maxPixels: 1e9,
    });
    return ee.Feature(null, {
      date: img.date().format('YYYY-MM-dd'),
      ndvi: stats.get('ndvi'),
    });
  });
}

export function buildModisNdviFeatureCollection(area, start, end) {
  const collection = ee
    .ImageCollection(MODIS_COLLECTION)
    .filterBounds(area)
    .filterDate(start, end)
    .select('NDVI');

  return collection.map((img) => {
    const ndvi = img.multiply(MODIS_NDVI_SCALE).rename('ndvi');
    const stats = ndvi.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: area,
      scale: MODIS_SCALE,
      maxPixels: 1e9,
    });
    return ee.Feature(null, {
      date: img.date().format('YYYY-MM-dd'),
      ndvi: stats.get('ndvi'),
    });
  });
}

/**
 * Priority fusion: S2 > Landsat > MODIS for each YYYY-MM month.
 * Returns monthly NDVI series plus per-month sensor attribution.
 */
export function fuseMultiSensorMonthly(monthGrid, s2Months, landsatMonths, modisMonths) {
  const s2Map = new Map(s2Months.map((r) => [r.date, r.ndvi]));
  const landsatMap = new Map(landsatMonths.map((r) => [r.date, r.ndvi]));
  const modisMap = new Map(modisMonths.map((r) => [r.date, r.ndvi]));

  const sensorCounts = { Sentinel2: 0, Landsat: 0, MODIS: 0, none: 0 };
  const fused = [];

  for (const date of monthGrid) {
    let ndvi = null;
    let ndvi_sensor = null;

    if (s2Map.has(date)) {
      ndvi = s2Map.get(date);
      ndvi_sensor = 'Sentinel2';
      sensorCounts.Sentinel2 += 1;
    } else if (landsatMap.has(date)) {
      ndvi = landsatMap.get(date);
      ndvi_sensor = 'Landsat';
      sensorCounts.Landsat += 1;
    } else if (modisMap.has(date)) {
      ndvi = modisMap.get(date);
      ndvi_sensor = 'MODIS';
      sensorCounts.MODIS += 1;
    } else {
      sensorCounts.none += 1;
    }

    fused.push({ date, ndvi, ndvi_sensor });
  }

  return { fused, sensorCounts };
}

export async function fetchMultiSensorNdviMonths(area, start, end) {
  const [s2Raw, landsatRaw, modisRaw] = await Promise.all([
    evaluate(buildS2NdviFeatureCollection(area, start, end)),
    evaluate(buildLandsatNdviFeatureCollection(area, start, end)),
    evaluate(buildModisNdviFeatureCollection(area, start, end)),
  ]);

  return {
    s2Months: aggregateScenesToMonths(s2Raw),
    landsatMonths: aggregateScenesToMonths(landsatRaw),
    modisMonths: aggregateScenesToMonths(modisRaw),
  };
}
