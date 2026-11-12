/**
 * Apply saved theme before first paint (CSP-safe external script).
 * Prefer: auto | light | dark
 *
 * Order of truth:
 * 1) Main-process preference injected by preload (__IEA_THEME_BOOT__)
 * 2) localStorage mirror (iea.theme)
 * 3) auto
 */
(function bootTheme() {
  const KEY = 'iea.theme';
  let pref = 'auto';

  try {
    const boot = window.__IEA_THEME_BOOT__;
    if (boot && (boot.preference === 'light' || boot.preference === 'dark' || boot.preference === 'auto')) {
      pref = boot.preference;
    } else {
      const saved = localStorage.getItem(KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'auto') pref = saved;
    }
  } catch (_) {}

  const systemLight =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: light)').matches;
  const resolved =
    pref === 'light' || pref === 'dark'
      ? pref
      : window.__IEA_THEME_BOOT__?.resolved || (systemLight ? 'light' : 'dark');

  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.dataset.themePref = pref;
  root.style.colorScheme = resolved;

  try {
    localStorage.setItem(KEY, pref);
  } catch (_) {}
})();
