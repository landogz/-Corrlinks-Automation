#!/usr/bin/env node
/**
 * Mechanical check: every catalog theme id has a CSS token block,
 * and density / type-scale selectors exist.
 */
const fs = require('fs');
const path = require('path');
const {
  THEMES,
  DENSITIES,
  TYPE_SCALES,
  normalizeTheme,
  normalizeDensity,
  normalizeTypeScale,
  resolveThemeId,
  resolveScheme,
  getWindowBackground,
} = require('../shared/appearance');

const ROOT = path.join(__dirname, '..');
const CSS_PATH = path.join(ROOT, 'renderer', 'styles.css');
const INDEX_PATH = path.join(ROOT, 'renderer', 'index.html');

let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`smoke-appearance: ${msg}`);
  }
}

const css = fs.readFileSync(CSS_PATH, 'utf8');
const html = fs.readFileSync(INDEX_PATH, 'utf8');

assert(THEMES.length >= 14, 'catalog should include Auto/Light/Dark + named palettes');
assert(DENSITIES.some((d) => d.id === 'comfortable'), 'comfortable density required');
assert(DENSITIES.some((d) => d.id === 'compact'), 'compact density required');
assert(TYPE_SCALES.some((t) => t.id === 'default'), 'default type scale required');
assert(TYPE_SCALES.some((t) => t.id === 'large'), 'large type scale required');

assert(normalizeTheme('OCEAN') === 'ocean', 'normalizeTheme should accept ocean');
assert(normalizeTheme('nope') === 'auto', 'unknown theme falls back to auto');
assert(normalizeDensity('compact') === 'compact', 'normalizeDensity compact');
assert(normalizeTypeScale('large') === 'large', 'normalizeTypeScale large');
assert(resolveThemeId('auto', { systemLight: true }) === 'light', 'auto + system light → light');
assert(resolveThemeId('ocean') === 'ocean', 'named theme resolves to itself');
assert(resolveScheme('warm-paper') === 'light', 'warm-paper scheme is light');
assert(resolveScheme('forest') === 'dark', 'forest scheme is dark');
assert(
  /^#[0-9a-fA-F]{6}$/.test(getWindowBackground('ocean')),
  'ocean window background is a hex color'
);

for (const theme of THEMES) {
  if (theme.id === 'auto') continue;
  const needle = `html[data-theme='${theme.id}']`;
  assert(css.includes(needle), `missing CSS token block for ${theme.id}`);
  if (theme.id !== 'light' && theme.id !== 'dark') {
    assert(theme.backgroundColor, `${theme.id} needs backgroundColor`);
    assert(theme.scheme === 'light' || theme.scheme === 'dark', `${theme.id} needs scheme`);
  }
  if (theme.id !== 'auto') {
    assert(theme.accentColor, `${theme.id} needs accentColor for visible swatches`);
  }
}

assert(css.includes("html[data-density='compact']"), 'missing compact density CSS');
assert(css.includes("html[data-type='large']"), 'missing large type CSS');
assert(css.includes("html[data-scheme='light']"), 'light component rules should use data-scheme');
assert(
  /html\[data-scheme='light'\]\s*\{[^}]*--info-fg:/s.test(css),
  'light scheme must redefine --info-fg for notification contrast'
);
assert(
  /html\[data-scheme='dark'\]\s*\{[^}]*--info-fg:/s.test(css),
  'dark scheme must define --info-fg'
);
assert(css.includes('.toast.info'), 'toast.info styles required');
assert(css.includes('.updates-message'), 'updates-message styles required');
assert(
  /html\[data-theme='warm-paper'\]/.test(css) && /html\[data-theme='soft-gray'\]/.test(css),
  'named light themes must exist'
);
assert(css.includes('.appearance-seg--3'), 'compact Auto/Dark/Light segment CSS missing');
assert(css.includes('.appearance-chip-row'), 'full picker chip-row CSS missing');
assert(css.includes('.appearance-layout-block'), 'density/text layout block CSS missing');
assert(
  css.includes('.appearance-panel button.appearance-btn.is-active'),
  'active appearance button color CSS missing'
);
assert(
  (html.match(/data-appearance-mount=/g) || []).length >= 2,
  'index.html needs appearance mounts (account, about)'
);
assert(!html.includes('data-appearance-mount="login"'), 'login must not show appearance panel');
assert(html.includes('data-appearance-mount="account"'), 'account appearance mount required');
assert(html.includes('data-appearance-mount="about"'), 'about appearance mount required');

const renderer = fs.readFileSync(path.join(ROOT, 'renderer', 'renderer.js'), 'utf8');
assert(renderer.includes("mode === 'compact'"), 'compact appearance panel builder missing');
assert(renderer.includes('data-appearance-open-about'), 'More appearance… opener missing');
assert(renderer.includes('appearance-swatch--card'), 'labeled theme swatch cards missing');
assert(renderer.includes('appearance-swatch-accent'), 'accent half of swatch preview missing');
assert(css.includes('.appearance-swatch-preview'), 'swatch preview CSS missing');
assert(css.includes('.appearance-chip-grid'), 'theme chip grid CSS missing');
assert(renderer.includes('data-density-pref'), 'density controls missing');
assert(renderer.includes('data-type-pref'), 'type scale controls missing');

if (failed) {
  console.error(`smoke-appearance: ${failed} failure(s)`);
  process.exit(1);
}

console.log(
  `smoke-appearance: ok (${THEMES.length - 1} palettes + density/type + ${
    (html.match(/data-appearance-mount=/g) || []).length
  } mounts)`
);
