const fs = require('fs');
const path = require('path');

const DEFAULTS = {
  theme: 'auto', // auto | light | dark
};

function getPrefsPath() {
  try {
    const { app } = require('electron');
    if (app?.isReady?.() && typeof app.getPath === 'function') {
      return path.join(app.getPath('userData'), 'ui-preferences.json');
    }
  } catch (_) {}
  return path.join(__dirname, '..', 'ui-preferences.json');
}

function normalizeTheme(value) {
  const theme = String(value || '').toLowerCase();
  return theme === 'light' || theme === 'dark' || theme === 'auto' ? theme : 'auto';
}

function loadUiPreferences() {
  try {
    const filePath = getPrefsPath();
    if (!fs.existsSync(filePath)) return { ...DEFAULTS };
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!raw || typeof raw !== 'object') return { ...DEFAULTS };
    return {
      theme: normalizeTheme(raw.theme),
    };
  } catch (_) {
    return { ...DEFAULTS };
  }
}

function saveUiPreferences( partial = {}) {
  const current = loadUiPreferences();
  const next = {
    ...current,
    ...partial,
    theme: normalizeTheme(partial.theme != null ? partial.theme : current.theme),
  };
  const filePath = getPrefsPath();
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  } catch (_) {}
  return next;
}

module.exports = {
  getPrefsPath,
  loadUiPreferences,
  saveUiPreferences,
  normalizeTheme,
};
