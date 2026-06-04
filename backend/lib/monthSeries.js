/**
 * Continuous calendar month grid between startDate and endDate.
 * endDate is exclusive at month boundary (2024-01-01 → last month 2023-12).
 */
export function buildMonthGrid(startIso, endIso) {
  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);

  if (start >= end) {
    return [];
  }

  const months = [];
  let year = start.getUTCFullYear();
  let month = start.getUTCMonth();
  const endYear = end.getUTCFullYear();
  const endMonth = end.getUTCMonth();

  while (year < endYear || (year === endYear && month < endMonth)) {
    months.push(`${year}-${String(month + 1).padStart(2, '0')}`);
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  return months;
}

export function monthNumberFromYearMonth(yearMonth) {
  return parseInt(yearMonth.split('-')[1], 10);
}

function parseIsoDate(iso) {
  return new Date(`${iso.slice(0, 10)}T00:00:00.000Z`);
}

export function yearMonthKey(isoDate) {
  return isoDate.slice(0, 7);
}
