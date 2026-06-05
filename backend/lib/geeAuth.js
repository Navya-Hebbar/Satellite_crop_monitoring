import ee from '@google/earthengine';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.join(__dirname, '..');

/** @type {'pending' | 'ready' | 'failed' | 'misconfigured'} */
let status = 'pending';
let errorMessage = null;
let credentialSource = null;
let serviceAccountEmail = null;

const REQUIRED_SA_FIELDS = ['type', 'client_email', 'private_key'];

/**
 * How this project authenticated before:
 * - A Google Cloud **service account** JSON key was saved as `backend/gee-key.json`.
 * - That path is listed in `.gitignore`, so it never lived in git — only on your machine.
 * - At startup, the file was parsed and passed to `ee.data.authenticateViaPrivateKey()`,
 *   then `ee.initialize()` for the non-interactive (server) Earth Engine session.
 * - MapView references GCP project `datavisual-494214`; the key's `project_id` should match.
 */
export function getGeeStatus() {
  return {
    status,
    ready: status === 'ready',
    error: errorMessage,
    credentialSource,
    serviceAccountEmail,
    hints: getHintsForStatus(),
  };
}

export function isGeeReady() {
  return status === 'ready';
}

function getHintsForStatus() {
  if (status === 'ready') return [];
  if (status === 'misconfigured') {
    return [
      'Set GEE_CREDENTIALS_PATH to your service account JSON (path outside the repo is recommended).',
      'Or set GOOGLE_APPLICATION_CREDENTIALS to the same JSON file (Google standard).',
      'Or set GEE_SERVICE_ACCOUNT_JSON in backend/.env (single-line JSON).',
      'Legacy fallback: place key at backend/gee-key.json (still supported).',
      'Register the service account at https://signup.earthengine.google.com/ (commercial) or enable Earth Engine for the GCP project.',
    ];
  }
  if (status === 'failed') {
    return [
      'Confirm the service account is registered for Earth Engine access.',
      'Confirm the JSON key was not revoked in IAM → Service Accounts → Keys.',
      'Run: npm run check-gee (from backend/) for a focused diagnostic.',
    ];
  }
  return ['Earth Engine is still initializing; retry in a few seconds.'];
}

function formatError(err) {
  if (!err) return 'Unknown Earth Engine error';
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/**
 * Validate service account JSON shape expected by authenticateViaPrivateKey.
 */
export function validateServiceAccountJson(credentials, sourceLabel) {
  if (!credentials || typeof credentials !== 'object') {
    return { ok: false, error: `${sourceLabel}: credentials must be a JSON object` };
  }
  if (credentials.type && credentials.type !== 'service_account') {
    return {
      ok: false,
      error: `${sourceLabel}: expected type "service_account", got "${credentials.type}"`,
    };
  }
  const missing = REQUIRED_SA_FIELDS.filter((f) => !credentials[f]);
  if (missing.length) {
    return {
      ok: false,
      error: `${sourceLabel}: missing required fields: ${missing.join(', ')}`,
    };
  }
  return { ok: true, email: credentials.client_email };
}

function readJsonFile(filePath, sourceLabel) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    return { ok: false, error: `${sourceLabel}: file not found (${resolved})` };
  }
  try {
    const raw = fs.readFileSync(resolved, 'utf8');
    const parsed = JSON.parse(raw);
    const validation = validateServiceAccountJson(parsed, sourceLabel);
    if (!validation.ok) return { ok: false, error: validation.error };
    return { ok: true, credentials: parsed, source: sourceLabel, path: resolved, email: validation.email };
  } catch (e) {
    return { ok: false, error: `${sourceLabel}: ${e.message}` };
  }
}

/**
 * Resolve credentials in priority order (first match wins):
 *
 * 1. GEE_SERVICE_ACCOUNT_JSON — full JSON string in .env (no file on disk)
 * 2. GEE_CREDENTIALS_PATH — explicit path (recommended for production)
 * 3. GEE_PRIVATE_KEY_PATH — alias of #2
 * 4. GOOGLE_APPLICATION_CREDENTIALS — standard ADC file path
 * 5. backend/gee-key.json — legacy default (backward compatible)
 */
export function resolveGeeCredentials() {
  const inlineJson = process.env.GEE_SERVICE_ACCOUNT_JSON?.trim();
  if (inlineJson) {
    try {
      const parsed = JSON.parse(inlineJson);
      const validation = validateServiceAccountJson(parsed, 'GEE_SERVICE_ACCOUNT_JSON');
      if (!validation.ok) return { ok: false, error: validation.error };
      return {
        ok: true,
        credentials: parsed,
        source: 'GEE_SERVICE_ACCOUNT_JSON',
        email: validation.email,
      };
    } catch (e) {
      return { ok: false, error: `GEE_SERVICE_ACCOUNT_JSON: invalid JSON — ${e.message}` };
    }
  }

  const explicitPath =
    process.env.GEE_CREDENTIALS_PATH?.trim() ||
    process.env.GEE_PRIVATE_KEY_PATH?.trim();
  if (explicitPath) {
    return readJsonFile(explicitPath, 'GEE_CREDENTIALS_PATH');
  }

  const adcPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (adcPath) {
    return readJsonFile(adcPath, 'GOOGLE_APPLICATION_CREDENTIALS');
  }

  const legacyPath = path.join(BACKEND_ROOT, 'gee-key.json');
  if (fs.existsSync(legacyPath)) {
    const result = readJsonFile(legacyPath, 'backend/gee-key.json (legacy)');
    if (result.ok) {
      console.warn(
        '[GEE] Using legacy backend/gee-key.json. Prefer GEE_CREDENTIALS_PATH outside the repo.'
      );
    }
    return result;
  }

  return {
    ok: false,
    error: [
      'No Earth Engine credentials found.',
      'Set one of: GEE_CREDENTIALS_PATH, GOOGLE_APPLICATION_CREDENTIALS,',
      'GEE_SERVICE_ACCOUNT_JSON, or restore backend/gee-key.json.',
      'See backend/.env.example',
    ].join(' '),
  };
}

/**
 * Initialize Earth Engine once at process startup.
 * Returns a Promise that resolves when ready or rejects on misconfiguration/auth failure.
 */
export function initializeGee() {
  return new Promise((resolve) => {
    const resolved = resolveGeeCredentials();

    if (!resolved.ok) {
      status = 'misconfigured';
      errorMessage = resolved.error;
      credentialSource = null;
      console.error('[GEE] MISCONFIGURED:', errorMessage);
      resolve(getGeeStatus());
      return;
    }

    const { credentials, source, email } = resolved;
    credentialSource = source;
    serviceAccountEmail = email;
    status = 'pending';
    errorMessage = null;

    console.log(`[GEE] Authenticating via ${source} (${email})`);

    ee.data.authenticateViaPrivateKey(
      credentials,
      () => {
        ee.initialize(
          null,
          null,
          () => {
            status = 'ready';
            errorMessage = null;
            console.log('[GEE] SUCCESS: Earth Engine initialized.');
            resolve(getGeeStatus());
          },
          (initErr) => {
            status = 'failed';
            errorMessage = `ee.initialize failed: ${formatError(initErr)}`;
            console.error('[GEE] INITIALIZE FAILED:', errorMessage);
            resolve(getGeeStatus());
          }
        );
      },
      (authErr) => {
        status = 'failed';
        errorMessage = `authenticateViaPrivateKey failed: ${formatError(authErr)}`;
        console.error('[GEE] AUTH FAILED:', errorMessage);
        resolve(getGeeStatus());
      }
    );
  });
}

export function buildGeeNotReadyPayload() {
  const s = getGeeStatus();
  return {
    error: 'Google Earth Engine is not available.',
    gee: {
      status: s.status,
      message: s.error,
      credentialSource: s.credentialSource,
      serviceAccountEmail: s.serviceAccountEmail,
      hints: s.hints,
    },
  };
}
