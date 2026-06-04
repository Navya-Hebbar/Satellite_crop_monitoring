/**
 * Downloads multi-location forecast ML dataset → forecast_dataset.csv
 *
 * Usage (from backend/):
 *   npm run export-forecast-dataset
 *   node scripts/exportForecastDatasetToCsv.js --start 2018-01-01 --end 2024-01-01
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PORT = process.env.PORT || 3001;
const DEFAULT_BASE = `http://localhost:${DEFAULT_PORT}`;

function parseArgs(argv) {
  const args = {
    startDate: '2018-01-01',
    endDate: '2024-01-01',
    buffer: '1000',
    out: path.join(__dirname, '..', '..', 'forecast_dataset.csv'),
    baseUrl: process.env.API_BASE_URL || DEFAULT_BASE,
    locations: null,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === '--start') args.startDate = value;
    else if (key === '--end') args.endDate = value;
    else if (key === '--buffer') args.buffer = value;
    else if (key === '--out') args.out = path.resolve(value);
    else if (key === '--base') args.baseUrl = value.replace(/\/$/, '');
    else if (key === '--locations') args.locations = value;
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const params = new URLSearchParams({
    startDate: args.startDate,
    endDate: args.endDate,
    buffer: args.buffer,
    format: 'csv',
    multi: 'true',
  });

  if (args.locations) {
    params.set('locations', args.locations);
    params.delete('multi');
  }

  const url = `${args.baseUrl}/api/export-forecast-dataset?${params}`;
  console.log(`Fetching multi-location forecast dataset:\n${url}\n`);

  const response = await fetch(url);
  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`API ${response.status}: ${errBody}`);
  }

  const csv = await response.text();
  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, csv, 'utf8');
  const rowCount = Math.max(0, csv.split('\n').filter(Boolean).length - 1);
  console.log(`Wrote ${rowCount} training rows to ${args.out}`);
}

main().catch((err) => {
  console.error('Export failed:', err.message);
  process.exit(1);
});
