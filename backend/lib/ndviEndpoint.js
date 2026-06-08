import ee from '@google/earthengine';
import { evaluate } from './cropDataset.js';

const S2_COLLECTION = 'COPERNICUS/S2_SR_HARMONIZED';
const NDVI_SCALE_METERS = 10;

/**
 * Original /api/ndvi behavior: per Sentinel-2 scene date, NDVI + health status only.
 * Used by the React dashboard — do not add weather fields or monthly aggregation here.
 */
export async function fetchNdviTimeSeries({ area, start, end }) {
  const collection = ee
    .ImageCollection(S2_COLLECTION)
    .filterBounds(area)
    .filterDate(start, end)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20));

  const ndviSeries = collection.map((img) => {
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

  const data = await evaluate(ndviSeries);
  if (!data?.features?.length) {
    return [];
  }

  return data.features
    .map((f) => ({
      date: f.properties.date,
      ndvi: f.properties.ndvi,
      status:
        f.properties.ndvi > 0.6
          ? 'Healthy'
          : f.properties.ndvi >= 0.3
            ? 'Moderate'
            : 'Unhealthy',
    }))
    .filter((f) => f.ndvi != null && !Number.isNaN(f.ndvi));
}
