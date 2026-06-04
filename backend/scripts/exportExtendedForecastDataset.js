/**
 * Export extended forecast dataset (20 locations, 2010-2025) to CSV.
 * Requires backend running: npm start
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_BASE = `http://localhost:${process.env.PORT || 3001}`;

async function main() {
  const params = new URLSearchParams({
    startDate: '2010-01-01',
    endDate: '2026-01-01',
    buffer: '1000',
    format: 'csv',
  });

  const url = `${process.env.API_BASE_URL || DEFAULT_BASE}/api/export-forecast-dataset-extended?${params}`;
  console.log(`Fetching extended dataset (this may take several minutes):\n${url}\n`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${await response.text()}`);
  }

  const csv = await response.text();
  const out = path.join(__dirname, '..', '..', 'forecast_dataset_extended.csv');
  fs.writeFileSync(out, csv, 'utf8');
  const rows = Math.max(0, csv.split('\n').filter(Boolean).length - 1);
  console.log(`Wrote ${rows} rows to ${out}`);
}

main().catch((e) => {
  console.error('Export failed:', e.message);
  process.exit(1);
});
