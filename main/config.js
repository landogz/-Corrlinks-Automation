const fs = require('fs');
const path = require('path');

function resolveEnvPath() {
  const candidates = [];

  // Packaged app: prefer .env beside the executable / in Resources
  try {
    const { app } = require('electron');
    if (app?.isPackaged) {
      candidates.push(path.join(path.dirname(process.execPath), '.env'));
      // macOS: Inmate Exchange Auto.app/Contents/MacOS → put .env next to .app
      if (process.platform === 'darwin') {
        const appBundle = path.resolve(process.execPath, '..', '..', '..');
        candidates.push(path.join(path.dirname(appBundle), '.env'));
        candidates.push(path.join(appBundle, 'Contents', 'Resources', '.env'));
      }
      if (process.resourcesPath) {
        candidates.push(path.join(process.resourcesPath, '.env'));
      }
      candidates.push(path.join(app.getPath('userData'), '.env'));
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

function getSportsDataConfig() {
  const baseUrl = (process.env.SPORTSDATA_BASE_URL || 'https://sportsdata.com').replace(/\/$/, '');
  const email = process.env.SPORTSDATA_EMAIL || '';
  const password = process.env.SPORTSDATA_PASSWORD || '';

  return { baseUrl, email, password };
}

function getAppTimezone() {
  return process.env.APP_TIMEZONE || 'America/New_York';
}

module.exports = {
  CORRLINKS,
  getSportsDataConfig,
  getAppTimezone,
  resolveEnvPath,
  envPath,
};
