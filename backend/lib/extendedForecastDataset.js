/**
 * Extended forecast dataset: 20 locations, 2010–2025, multi-sensor NDVI fusion.
 */
import ee from '@google/earthengine';
import {
  evaluate,
  parseDateRange,
  buildMonthlyWeatherFeatureCollection,
  weatherMonthsFromFeatures,
} from './cropDataset.js';
import { buildMonthGrid, monthNumberFromYearMonth } from './monthSeries.js';
import {
  interpolateMonthlyNdvi,
  fillWeatherOnMonthGrid,
} from './ndviInterpolation.js';
import {
  parseForecastLocations,
  EXTENDED_FORECAST_LOCATIONS,
  EXTENDED_DATE_DEFAULTS,
} from './forecastLocations.js';
import {
  fetchMultiSensorNdviMonths,
  fuseMultiSensorMonthly,
} from './multiSensorNdvi.js';

export const EXTENDED_CSV_HEADERS = [
  'location',
  'date',
  'month',
  'ndvi',
  'ndvi_sensor',
  'prev_ndvi',
  'ndvi_change',
  'temperature',
  'rainfall',
  'next_ndvi',
];

export { EXTENDED_FORECAST_LOCATIONS, parseForecastLocations };

function round(value, decimals) {
  if (value == null || Number.isNaN(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function buildLocationMonthlySeriesExtended({
  locationName,
  monthGrid,
  fusedNdviMonths,
  weatherMonths,
}) {
  const observedByMonth = new Map(
    fusedNdviMonths.filter((r) => r.ndvi != null).map((r) => [r.date, r.ndvi])
  );
  const sensorByMonth = new Map(fusedNdviMonths.map((r) => [r.date, r.ndvi_sensor]));

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
      ndvi_sensor: sensorByMonth.get(date) || (ndviEntry.interpolated ? 'interpolated' : null),
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
      ndvi_sensor: row.ndvi_sensor,
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
      observedMonths: observedByMonth.size,
      missingBeforeInterpolation: ndviResult.missingBeforeFill.length,
      interpolatedMonths: ndviResult.interpolatedMonths.length,
      trainingRows: trainingRows.length,
    },
  };
}

export async function fetchLocationExtendedData({
  name,
  lat,
  lng,
  start,
  end,
  bufferRadius,
  monthGrid,
}) {
  const grid = monthGrid || buildMonthGrid(start, end);
  const area = ee.Geometry.Point([lng, lat]).buffer(bufferRadius);

  const [sensorData, weatherRaw] = await Promise.all([
    fetchMultiSensorNdviMonths(area, start, end),
    evaluate(buildMonthlyWeatherFeatureCollection(area, start, end)),
  ]);

  const { fused, sensorCounts } = fuseMultiSensorMonthly(
    grid,
    sensorData.s2Months,
    sensorData.landsatMonths,
    sensorData.modisMonths
  );

  const weatherMonths = weatherMonthsFromFeatures(weatherRaw);

  const built = buildLocationMonthlySeriesExtended({
    locationName: name,
    monthGrid: grid,
    fusedNdviMonths: fused,
    weatherMonths,
  });

  return { ...built, sensorCounts };
}

async function runLocationBatch(locations, params, monthGrid) {
  return Promise.all(
    locations.map(async (loc) => {
      console.log(`[Extended] GEE fetch: ${loc.name} [${loc.lat}, ${loc.lng}]`);
      const result = await fetchLocationExtendedData({
        name: loc.name,
        lat: loc.lat,
        lng: loc.lng,
        ...params,
        monthGrid,
      });
      console.log(
        `[Extended] ${loc.name}: observed=${result.stats.observedMonths}/${monthGrid.length}, ` +
          `interpolated=${result.stats.interpolatedMonths}, rows=${result.stats.trainingRows}, ` +
          `sensors=${JSON.stringify(result.sensorCounts)}`
      );
      return result;
    })
  );
}

export async function fetchExtendedForecastDataset({
  locations,
  start,
  end,
  bufferRadius = 1000,
  batchSize = 5,
}) {
  const monthGrid = buildMonthGrid(start, end);
  const expectedMonths = monthGrid.length;
  const startYear = parseInt(start.slice(0, 4), 10);
  const endYear = parseInt(end.slice(0, 4), 10) - (end.endsWith('-01-01') ? 1 : 0);

  console.log(
    `[Extended] ${locations.length} locations, ${expectedMonths} months ` +
      `(${monthGrid[0]} -> ${monthGrid[monthGrid.length - 1]})`
  );

  const perLocationResults = [];
  for (let i = 0; i < locations.length; i += batchSize) {
    const batch = locations.slice(i, i + batchSize);
    console.log(`[Extended] Batch ${Math.floor(i / batchSize) + 1}: ${batch.map((l) => l.name).join(', ')}`);
    const batchResults = await runLocationBatch(batch, { start, end, bufferRadius }, monthGrid);
    perLocationResults.push(...batchResults);
  }

  const allTrainingRows = perLocationResults.flatMap((r) => r.trainingRows);
  const quality = buildExtendedQualityReport({
    start,
    end,
    monthGrid,
    perLocationResults,
    allTrainingRows,
    startYear,
    endYear,
  });

  console.log(
    `[Extended] Complete: ${allTrainingRows.length} training rows, ` +
      `${locations.length} locations, sensors=${JSON.stringify(quality.sensorBreakdown)}`
  );

  return { rows: allTrainingRows, quality, perLocation: perLocationResults, monthGrid };
}

export function buildExtendedQualityReport({
  monthGrid,
  perLocationResults,
  allTrainingRows,
  startYear,
  endYear,
}) {
  const sensorBreakdown = { Sentinel2: 0, Landsat: 0, MODIS: 0, interpolated: 0, none: 0 };

  for (const loc of perLocationResults) {
    if (loc.sensorCounts) {
      sensorBreakdown.Sentinel2 += loc.sensorCounts.Sentinel2 || 0;
      sensorBreakdown.Landsat += loc.sensorCounts.Landsat || 0;
      sensorBreakdown.MODIS += loc.sensorCounts.MODIS || 0;
      sensorBreakdown.none += loc.sensorCounts.none || 0;
    }
    sensorBreakdown.interpolated += loc.stats.interpolatedMonths || 0;
  }

  const totalInterpolated = perLocationResults.reduce(
    (s, r) => s + r.stats.interpolatedMonths,
    0
  );
  const totalMissingBefore = perLocationResults.reduce(
    (s, r) => s + r.stats.missingBeforeInterpolation,
    0
  );

  return {
    rows: allTrainingRows.length,
    totalRows: allTrainingRows.length,
    locations: perLocationResults.length,
    locationsList: perLocationResults.map((r) => r.stats.location),
    years: endYear - startYear + 1,
    yearRange: { start: startYear, end: endYear },
    monthsPerLocation: monthGrid.length,
    missingMonths: totalMissingBefore,
    missingMonthsAfterFill: 0,
    interpolatedMonths: totalInterpolated,
    rowsPerLocation: perLocationResults.map((r) => ({
      location: r.stats.location,
      rows: r.stats.trainingRows,
      observed: r.stats.observedMonths,
      interpolated: r.stats.interpolatedMonths,
    })),
    sensorBreakdown,
    sensorStrategy:
      'Priority: Sentinel-2 (2015+) > Landsat 7/8/9 > MODIS MOD13Q1; linear NDVI gap-fill after fusion',
    duplicateRows: allTrainingRows.length - new Set(
      allTrainingRows.map((r) => `${r.location}|${r.date}`)
    ).size,
  };
}

export function extendedRowsToCsv(rows) {
  const header = EXTENDED_CSV_HEADERS.join(',');
  const lines = rows.map((row) =>
    EXTENDED_CSV_HEADERS.map((key) => {
      const val = row[key];
      return val === null || val === undefined ? '' : String(val);
    }).join(',')
  );
  return [header, ...lines].join('\n');
}

export function validateExtendedForecastRequest(query) {
  const dates = parseDateRange({
    startDate: query.startDate || EXTENDED_DATE_DEFAULTS.startDate,
    endDate: query.endDate || EXTENDED_DATE_DEFAULTS.endDate,
  });
  if (dates.error) {
    return { error: dates.error, status: 400 };
  }

  const locParsed = parseForecastLocations(query, { extended: true });
  if (locParsed.error) {
    return { error: locParsed.error, status: 400 };
  }

  return {
    locations: locParsed.locations,
    bufferRadius: parseInt(query.buffer, 10) || 1000,
    start: dates.start,
    end: dates.end,
  };
}
