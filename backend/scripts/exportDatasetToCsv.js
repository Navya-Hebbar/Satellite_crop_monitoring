/**
 * Fetches ML-ready crop data from the backend and writes dataset.csv.
 *
 * Usage (from backend/):
 *   node scripts/exportDatasetToCsv.js
 *   node scripts/exportDatasetToCsv.js --lat 12.9716 --lng 77.5946 --start 2023-01-01 --end 2024-01-01 --buffer 1000 --out ../dataset.csv
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PORT = process.env.PORT || 3001;
const DEFAULT_BASE = `http://localhost:${DEFAULT_PORT}`;

function parseArgs(argv) {
  const args = {
    lat: '12.9716',
    lng: '77.5946',
    regionName: 'Bangalore',
    startDate: '2023-01-01',
    endDate: '2024-01-01',
    buffer: '1000',
    out: path.join(__dirname, '..', '..', 'dataset.csv'),
    baseUrl: process.env.API_BASE_URL || DEFAULT_BASE,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === '--lat') args.lat = value;
    else if (key === '--lng') args.lng = value;
    else if (key === '--region') args.regionName = value;
    else if (key === '--start') args.startDate = value;
    else if (key === '--end') args.endDate = value;
    else if (key === '--buffer') args.buffer = value;
    else if (key === '--out') args.out = path.resolve(value);
    else if (key === '--base') args.baseUrl = value.replace(/\/$/, '');
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const params = new URLSearchParams({
    lat: args.lat,
    lng: args.lng,
    regionName: args.regionName,
    startDate: args.startDate,
    endDate: args.endDate,
    buffer: args.buffer,
  });

  const url = `${args.baseUrl}/api/export-dataset?${params.toString()}`;
  console.log(`Fetching dataset from ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`API ${response.status}: ${errBody}`);
  }

  const payload = await response.json();
  const csv = payload.csv ?? buildCsvFromRows(payload.data);

  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, csv, 'utf8');
  console.log(`Wrote ${payload.data?.length ?? 0} rows to ${args.out}`);
}

function buildCsvFromRows(rows) {
  const headers = ['date', 'ndvi', 'temperature', 'rainfall', 'month', 'status'];
  const headerLine = headers.join(',');
  const body = (rows || []).map((row) =>
    headers.map((h) => (row[h] == null ? '' : String(row[h]))).join(',')
  );
  return [headerLine, ...body].join('\n');
}

main().catch((err) => {
  console.error('Export failed:', err.message);
  process.exit(1);
});
