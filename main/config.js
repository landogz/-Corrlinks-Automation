const fs = require('fs');
const path = require('path');

function resolveEnvPath() {
  const candidates = [];

  // Packaged app: prefer .env beside the executable / in Resources
  try {
    const { app } = require('electron');
    if (app?.isPackaged) {
      candidates.push(path.join(app.getPath('userData'), '.env'));
      candidates.push(path.join(path.dirname(process.execPath), '.env'));
      // macOS: Inside Scores.app/Contents/MacOS → put .env next to .app
      if (process.platform === 'darwin') {
        const appBundle = path.resolve(process.execPath, '..', '..', '..');
        candidates.push(path.join(path.dirname(appBundle), '.env'));
        candidates.push(path.join(appBundle, 'Contents', 'Resources', '.env'));
      }
      if (process.resourcesPath) {
        candidates.push(path.join(process.resourcesPath, '.env'));
      }
    }
  } catch (_) {
    // electron may be unavailable in plain node smoke scripts
  }

  // Dev / smoke scripts
  candidates.push(path.join(__dirname, '..', '.env'));
  candidates.push(path.join(process.cwd(), '.env'));

  for (const candidate of candidates) {
    try {
      if (candidate && fs.existsSync(candidate)) return candidate;
    } catch (_) {}
  }

  return candidates[0] || path.join(__dirname, '..', '.env');
}

const envPath = resolveEnvPath();
require('dotenv').config({ path: envPath });

const CORRLINKS = {
  loginUrl: 'https://www.corrlinks.com/en-US/login',
  composeUrl: 'https://www.corrlinks.com/en-US/mailbox/compose',
  toFieldSelectors: [
    '.e-multiselect input',
    '.e-multi-select-wrapper input',
    'input[aria-label*="To" i]',
    'input[placeholder*="To" i]',
    '#to',
    'input[id*="to" i]',
  ],
  emailSelectors: [
    '#textbox_0',
    'input[type="email"]',
    'input[name="email"]',
    'input[name="Email"]',
    'input[name="username"]',
    'input[name="textbox_0"]',
    'input[id*="email" i]',
    'input[id*="user" i]',
  ],
  passwordSelectors: [
    '#textbox_1',
    'input[type="password"]',
    'input[name="password"]',
    'input[name="Password"]',
    'input[name="textbox_1"]',
    'input[id*="password" i]',
  ],
  submitSelectors: [
    'button.e-primary',
    'button.e-btn.e-primary',
    'button[type="submit"]',
    'input[type="submit"]',
    'button[id*="login" i]',
    'button[class*="login" i]',
    'form button',
  ],
  loginPathPattern: /\/login/i,
};

function getCredentialsPath() {
  try {
    const { app } = require('electron');
    if (app?.isReady?.() && typeof app.getPath === 'function') {
      return path.join(app.getPath('userData'), 'sportsdata-credentials.json');
    }
  } catch (_) {}
  return path.join(__dirname, '..', 'sportsdata-credentials.json');
}

/** Call once after app.whenReady so packaged installs use userData. */
function reloadSavedCredentials() {
  applyCredentialsToEnv(loadSavedCredentials());
  return getSportsDataConfig();
}

function loadSavedCredentials() {
  try {
    const filePath = getCredentialsPath();
    if (!fs.existsSync(filePath)) return {};
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!raw || typeof raw !== 'object') return {};
    return {
      baseUrl: typeof raw.baseUrl === 'string' ? raw.baseUrl : undefined,
      email: typeof raw.email === 'string' ? raw.email : undefined,
      password: typeof raw.password === 'string' ? raw.password : undefined,
    };
  } catch (_) {
    return {};
  }
}

/** True when a remembered credentials file exists with email + password. */
function hasRememberedCredentials() {
  const saved = loadSavedCredentials();
  return Boolean(saved.email && saved.password);
}

function applyCredentialsToEnv(creds = {}) {
  if (creds.baseUrl) process.env.SPORTSDATA_BASE_URL = String(creds.baseUrl).replace(/\/$/, '');
  if (creds.email != null) process.env.SPORTSDATA_EMAIL = String(creds.email);
  if (creds.password != null) process.env.SPORTSDATA_PASSWORD = String(creds.password);
}

function saveSportsDataCredentials({ email, password, baseUrl, remember = true } = {}) {
  const current = loadSavedCredentials();
  const next = {
    baseUrl: (baseUrl || current.baseUrl || process.env.SPORTSDATA_BASE_URL || 'https://sportsdata.com').replace(
      /\/$/,
      ''
    ),
    email: email != null ? String(email).trim() : current.email || '',
    password: password != null ? String(password) : current.password || '',
  };

  if (!next.email || !next.password) {
    throw new Error('SportsData email and password are required');
  }

  applyCredentialsToEnv(next);

  const filePath = getCredentialsPath();
  if (remember) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(next, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    return { ...next, credentialsPath: filePath, remembered: true };
  }

  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}

  return { ...next, credentialsPath: filePath, remembered: false };
}

/** Clear remembered SportsData login for this session (and delete credentials file). */
function clearSportsDataCredentials() {
  const filePath = getCredentialsPath();
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}

  const baseUrl = (process.env.SPORTSDATA_BASE_URL || 'https://sportsdata.com').replace(/\/$/, '');
  process.env.SPORTSDATA_EMAIL = '';
  process.env.SPORTSDATA_PASSWORD = '';
  // Keep base URL so the login form can still prefill it.
  process.env.SPORTSDATA_BASE_URL = baseUrl;

  return {
    ok: true,
    baseUrl,
    email: '',
    password: '',
    credentialsPath: filePath,
  };
}

// Saved UI credentials override empty/stale .env values
applyCredentialsToEnv(loadSavedCredentials());

function getSportsDataConfig() {
  const saved = loadSavedCredentials();
  const remembered = Boolean(saved.email && saved.password);
  const baseUrl = (saved.baseUrl || process.env.SPORTSDATA_BASE_URL || 'https://sportsdata.com').replace(/\/$/, '');
  // Prefer remembered file. Fall back to process.env for the active session
  // (after Sign in) or legacy .env — but auto-login must use `remembered` only.
  const email = saved.email || process.env.SPORTSDATA_EMAIL || '';
  const password = saved.password || process.env.SPORTSDATA_PASSWORD || '';

  return {
    baseUrl,
    email,
    password,
    remembered,
    credentialsPath: getCredentialsPath(),
  };
}

function getAppTimezone() {
  return process.env.APP_TIMEZONE || 'America/New_York';
}

module.exports = {
  CORRLINKS,
  getSportsDataConfig,
  getAppTimezone,
  resolveEnvPath,
  getCredentialsPath,
  loadSavedCredentials,
  hasRememberedCredentials,
  saveSportsDataCredentials,
  clearSportsDataCredentials,
  reloadSavedCredentials,
  envPath,
};
