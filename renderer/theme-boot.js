/**
 * Apply saved appearance before first paint (CSP-safe external script).
 * Prefer theme: auto | light | dark | named palette
 * Plus density (comfortable|compact) and typeScale (default|large).
 *
 * Order of truth:
 * 1) Main-process preference injected by preload (__IEA_THEME_BOOT__)
 * 2) localStorage mirrors (iea.theme / iea.density / iea.typeScale)
 * 3) defaults
 */
(function bootTheme() {
  const KEY_THEME = 'iea.theme';
  const KEY_DENSITY = 'iea.density';
  const KEY_TYPE = 'iea.typeScale';

  let pref = 'auto';
  let density = 'comfortable';
  let typeScale = 'default';
  let resolved = 'dark';
  let scheme = 'dark';

  try {
    const boot = window.__IEA_THEME_BOOT__;
    if (boot && boot.preference) {
      pref = String(boot.preference);
      density = boot.density || density;
      typeScale = boot.typeScale || typeScale;
      resolved = boot.resolved || resolved;
      scheme = boot.scheme || scheme;
    } else {
      const saved = localStorage.getItem(KEY_THEME);
      if (saved) pref = saved;
      const d = localStorage.getItem(KEY_DENSITY);
      if (d) density = d;
      const t = localStorage.getItem(KEY_TYPE);
      if (t) typeScale = t;

      const systemLight =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-color-scheme: light)').matches;
      if (pref === 'auto') {
        resolved = systemLight ? 'light' : 'dark';
        scheme = resolved;
      } else if (pref === 'light' || pref === 'warm-paper' || pref === 'soft-gray' || pref === 'high-contrast-light') {
        resolved = pref;
        scheme = 'light';
      } else {
        resolved = pref === 'dark' ? 'dark' : pref;
        scheme = 'dark';
        if (pref === 'dark') resolved = 'dark';
      }
    }
  } catch (_) {}

  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.dataset.themePref = pref;
  root.dataset.scheme = scheme;
  root.dataset.density = density === 'compact' ? 'compact' : 'comfortable';
  root.dataset.type = typeScale === 'large' ? 'large' : 'default';
  root.style.colorScheme = scheme;

  try {
    localStorage.setItem(KEY_THEME, pref);
    localStorage.setItem(KEY_DENSITY, root.dataset.density);
    localStorage.setItem(KEY_TYPE, root.dataset.type);
  } catch (_) {}
})();
