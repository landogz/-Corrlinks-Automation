/**
 * Single source of truth for appearance themes, density, and type scale.
 * Used by main (window chrome + prefs) and renderer (picker + CSS data attrs).
 */

const THEMES = [
  {
    id: 'auto',
    label: 'Auto',
    group: 'system',
    scheme: null, // follows OS
    backgroundColor: null,
    accentColor: null,
  },
  {
    id: 'dark',
    label: 'Dark',
    group: 'dark',
    scheme: 'dark',
    backgroundColor: '#0a0f16',
    accentColor: '#2dd4bf',
  },
  {
    id: 'light',
    label: 'Light',
    group: 'light',
    scheme: 'light',
    backgroundColor: '#f3f6fa',
    accentColor: '#0f766e',
  },
  {
    id: 'midnight',
    label: 'Midnight',
    group: 'dark',
    scheme: 'dark',
    backgroundColor: '#06080f',
    accentColor: '#818cf8',
  },
  {
    id: 'slate',
    label: 'Slate',
    group: 'dark',
    scheme: 'dark',
    backgroundColor: '#0f1419',
    accentColor: '#38bdf8',
  },
  {
    id: 'graphite',
    label: 'Graphite',
    group: 'dark',
    scheme: 'dark',
    backgroundColor: '#121212',
    accentColor: '#d4d4d4',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    group: 'dark',
    scheme: 'dark',
    backgroundColor: '#07131c',
    accentColor: '#22d3ee',
  },
  {
    id: 'forest',
    label: 'Forest',
    group: 'dark',
    scheme: 'dark',
    backgroundColor: '#0a120e',
    accentColor: '#4ade80',
  },
  {
    id: 'amber-night',
    label: 'Amber Night',
    group: 'dark',
    scheme: 'dark',
    backgroundColor: '#140e08',
    accentColor: '#fbbf24',
  },
  {
    id: 'plum',
    label: 'Plum',
    group: 'dark',
    scheme: 'dark',
    backgroundColor: '#120a16',
    accentColor: '#c084fc',
  },
  {
    id: 'high-contrast',
    label: 'High Contrast',
    group: 'dark',
    scheme: 'dark',
    backgroundColor: '#000000',
    accentColor: '#ffff00',
  },
  {
    id: 'warm-paper',
    label: 'Warm Paper',
    group: 'light',
    scheme: 'light',
    backgroundColor: '#f7f3eb',
    accentColor: '#b45309',
  },
  {
    id: 'soft-gray',
    label: 'Soft Gray',
    group: 'light',
    scheme: 'light',
    backgroundColor: '#eceff3',
    accentColor: '#475569',
  },
  {
    id: 'high-contrast-light',
    label: 'High Contrast Light',
    group: 'light',
    scheme: 'light',
    backgroundColor: '#ffffff',
    accentColor: '#0000ee',
  },
];

const DENSITIES = [
  { id: 'comfortable', label: 'Comfortable' },
  { id: 'compact', label: 'Compact' },
];

const TYPE_SCALES = [
  { id: 'default', label: 'Default' },
  { id: 'large', label: 'Large' },
];

const THEME_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t]));
const DENSITY_IDS = new Set(DENSITIES.map((d) => d.id));
const TYPE_SCALE_IDS = new Set(TYPE_SCALES.map((t) => t.id));

function normalizeTheme(value) {
  const id = String(value || '').toLowerCase();
  return THEME_BY_ID[id] ? id : 'auto';
}

function normalizeDensity(value) {
  const id = String(value || '').toLowerCase();
  return DENSITY_IDS.has(id) ? id : 'comfortable';
}

function normalizeTypeScale(value) {
  const id = String(value || '').toLowerCase();
  return TYPE_SCALE_IDS.has(id) ? id : 'default';
}

/**
 * Resolve Auto → light|dark from system; named themes keep their own id.
 * @param {string} pref
 * @param {{ systemLight?: boolean }} [opts]
 */
function resolveThemeId(pref, opts = {}) {
  const id = normalizeTheme(pref);
  if (id !== 'auto') return id;
  const systemLight =
    typeof opts.systemLight === 'boolean'
      ? opts.systemLight
      : false;
  return systemLight ? 'light' : 'dark';
}

/**
 * Scheme for Electron nativeTheme / color-scheme CSS.
 * @param {string} pref
 * @param {{ systemDark?: boolean }} [opts]
 */
function resolveScheme(pref, opts = {}) {
  const id = normalizeTheme(pref);
  if (id === 'auto') {
    return opts.systemDark ? 'dark' : 'light';
  }
  return THEME_BY_ID[id]?.scheme || 'dark';
}

function getThemeMeta(id) {
  return THEME_BY_ID[normalizeTheme(id)] || THEME_BY_ID.auto;
}

function getWindowBackground(pref, opts = {}) {
  const resolved = resolveThemeId(pref, opts);
  const meta = getThemeMeta(resolved);
  if (meta.backgroundColor) return meta.backgroundColor;
  return opts.systemLight ? '#f3f6fa' : '#0a0f16';
}

function listThemesByGroup() {
  return {
    system: THEMES.filter((t) => t.group === 'system'),
    dark: THEMES.filter((t) => t.group === 'dark'),
    light: THEMES.filter((t) => t.group === 'light'),
  };
}

module.exports = {
  THEMES,
  DENSITIES,
  TYPE_SCALES,
  THEME_BY_ID,
  normalizeTheme,
  normalizeDensity,
  normalizeTypeScale,
  resolveThemeId,
  resolveScheme,
  getThemeMeta,
  getWindowBackground,
  listThemesByGroup,
};
