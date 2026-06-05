export function formatDateInput(d) {
  return d.toISOString().slice(0, 10);
}

export function addMonths(yearMonth, n) {
  const [y, m] = yearMonth.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export const TIME_PRESETS = [
  { id: '6m', label: 'Last 6 Months', months: 6 },
  { id: '12m', label: 'Last 12 Months', months: 12 },
  { id: '24m', label: 'Last 24 Months', months: 24 },
  { id: '5y', label: 'Last 5 Years', months: 60 },
  { id: 'full', label: 'Full Range', months: null },
  { id: 'custom', label: 'Custom Range', months: null },
];

export function rangeFromPreset(presetId, customStart, customEnd) {
  const end = new Date();
  const endStr = formatDateInput(end);

  if (presetId === 'custom' && customStart && customEnd) {
    return { startDate: customStart, endDate: customEnd };
  }
  if (presetId === 'full') {
    return { startDate: '2010-01-01', endDate: endStr };
  }

  const preset = TIME_PRESETS.find((p) => p.id === presetId);
  const months = preset?.months ?? 12;
  const start = new Date(end);
  start.setMonth(start.getMonth() - months);
  return { startDate: formatDateInput(start), endDate: endStr };
}
