const fs = require('fs');
const path = require('path');
const {
  normalizeTheme,
  normalizeDensity,
  normalizeTypeScale,
} = require('../shared/appearance');

const DEFAULTS = {
  theme: 'auto',
  density: 'comfortable',
  typeScale: 'default',
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

function loadUiPreferences() {
  try {
    const filePath = getPrefsPath();
    if (!fs.existsSync(filePath)) return { ...DEFAULTS };
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!raw || typeof raw !== 'object') return { ...DEFAULTS };
    return {
      theme: normalizeTheme(raw.theme),
      density: normalizeDensity(raw.density),
      typeScale: normalizeTypeScale(raw.typeScale),
    };
  } catch (_) {
    return { ...DEFAULTS };
  }
}

function saveUiPreferences(partial = {}) {
  const current = loadUiPreferences();
  const next = {
    theme: normalizeTheme(partial.theme != null ? partial.theme : current.theme),
    density: normalizeDensity(partial.density != null ? partial.density : current.density),
    typeScale: normalizeTypeScale(
      partial.typeScale != null ? partial.typeScale : current.typeScale
    ),
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
  normalizeDensity,
  normalizeTypeScale,
  DEFAULTS,
};
