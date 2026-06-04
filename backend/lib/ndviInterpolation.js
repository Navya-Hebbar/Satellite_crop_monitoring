/**
 * NDVI gap filling for continuous monthly time series.
 *
 * Method: LINEAR INTERPOLATION for interior gaps, with FORWARD/BACKWARD FILL at edges.
 *
 * Why linear (not pure forward-fill):
 * - Crop NDVI usually changes gradually month-to-month (phenology).
 * - Linear interpolation estimates values between two real observations,
 *   which is more accurate than repeating a stale value across long monsoon cloud gaps.
 * - Forward-fill is only used when one side has no observation (start/end of series),
 *   because linear interpolation requires two anchors.
 */
export function interpolateMonthlyNdvi(monthGrid, observedByMonth) {
  const series = monthGrid.map((date) => ({
    date,
    ndvi: observedByMonth.has(date) ? observedByMonth.get(date) : null,
    observed: observedByMonth.has(date),
    interpolated: false,
  }));

  const missingBeforeFill = series.filter((r) => r.ndvi == null).map((r) => r.date);
  const interpolatedMonths = [];

  for (let i = 0; i < series.length; i += 1) {
    if (series[i].ndvi != null) continue;

    let prevIdx = i - 1;
    while (prevIdx >= 0 && series[prevIdx].ndvi == null) prevIdx -= 1;

    let nextIdx = i + 1;
    while (nextIdx < series.length && series[nextIdx].ndvi == null) nextIdx += 1;

    if (prevIdx >= 0 && nextIdx < series.length) {
      const span = nextIdx - prevIdx;
      const t = (i - prevIdx) / span;
      series[i].ndvi =
        series[prevIdx].ndvi + t * (series[nextIdx].ndvi - series[prevIdx].ndvi);
      series[i].interpolated = true;
      interpolatedMonths.push(series[i].date);
    } else if (prevIdx >= 0) {
      series[i].ndvi = series[prevIdx].ndvi;
      series[i].interpolated = true;
      interpolatedMonths.push(series[i].date);
    } else if (nextIdx < series.length) {
      series[i].ndvi = series[nextIdx].ndvi;
      series[i].interpolated = true;
      interpolatedMonths.push(series[i].date);
    }
  }

  return {
    series,
    missingBeforeFill,
    interpolatedMonths,
    method: 'linear_interior_forward_backward_edges',
  };
}

/**
 * Fill sparse weather onto a complete month grid (ERA5 is daily; gaps are rare).
 * Uses linear interpolation for temperature and rainfall when needed.
 */
export function fillWeatherOnMonthGrid(monthGrid, weatherByMonth) {
  const temperatureObs = new Map();
  const rainfallObs = new Map();

  for (const [date, w] of weatherByMonth.entries()) {
    if (w.temperature != null) temperatureObs.set(date, w.temperature);
    if (w.rainfall != null) rainfallObs.set(date, w.rainfall);
  }

  const tempFilled = interpolateMonthlyNdvi(monthGrid, temperatureObs).series;
  const rainFilled = interpolateMonthlyNdvi(monthGrid, rainfallObs).series;

  return monthGrid.map((date, i) => ({
    date,
    temperature: tempFilled[i].ndvi,
    rainfall: rainFilled[i].ndvi,
  }));
}
