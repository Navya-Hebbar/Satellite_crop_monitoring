/**
 * Earth Engine credential diagnostic (no HTTP server).
 * Run from backend/:  npm run check-gee
 */
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  resolveGeeCredentials,
  initializeGee,
  getGeeStatus,
} from '../lib/geeAuth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('=== Earth Engine credential diagnostic ===\n');

console.log('Environment variables set:');
console.log('  GEE_CREDENTIALS_PATH:', bool(process.env.GEE_CREDENTIALS_PATH));
console.log('  GEE_PRIVATE_KEY_PATH:', bool(process.env.GEE_PRIVATE_KEY_PATH));
console.log('  GOOGLE_APPLICATION_CREDENTIALS:', bool(process.env.GOOGLE_APPLICATION_CREDENTIALS));
console.log('  GEE_SERVICE_ACCOUNT_JSON:', bool(process.env.GEE_SERVICE_ACCOUNT_JSON));
console.log('  backend/gee-key.json exists:', fs.existsSync(path.join(__dirname, '..', 'gee-key.json')));
console.log('');

const resolved = resolveGeeCredentials();
if (!resolved.ok) {
  console.error('FAIL — cannot resolve credentials:\n ', resolved.error);
  process.exit(1);
}

console.log('Resolved credential source:', resolved.source);
console.log('Service account email:', resolved.email);
if (resolved.path) console.log('Key file path:', resolved.path);
console.log('\nAttempting ee.data.authenticateViaPrivateKey + ee.initialize...\n');

await initializeGee();
const status = getGeeStatus();

if (status.ready) {
  console.log('PASS — Earth Engine is ready.');
  process.exit(0);
}

console.error('FAIL — status:', status.status);
console.error('Error:', status.error);
console.error('\nHints:');
status.hints.forEach((h) => console.error(' -', h));
process.exit(1);

function bool(v) {
  return v ? 'yes' : 'no';
}
