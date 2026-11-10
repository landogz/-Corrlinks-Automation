const { test, expect } = require('@playwright/test');
const path = require('path');

const FILE_URL = `file://${path.join(__dirname, '../../renderer/index.html')}`;

const VIEWPORTS = [
  { name: 'phone-320', width: 320, height: 568 },
  { name: 'phone-375', width: 375, height: 667 },
  { name: 'phone-390', width: 390, height: 844 },
  { name: 'phone-land', width: 667, height: 375 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'bp-1023', width: 1023, height: 800 },
  { name: 'bp-1024', width: 1024, height: 800 },
  { name: 'laptop-1366', width: 1366, height: 768 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

async function stubApi(page) {
  await page.addInitScript(() => {
    window.api = {
      getConfigSummary: async () => ({
        baseUrl: 'https://sportsdata.com',
        email: 'operator@example.com',
        password: 'x',
        hasPassword: true,
        timezone: 'America/New_York',
        subjectToday: 'mon',
        credentialsPath: '/tmp/creds.json',
      }),
      refreshAccounts: async () => ({ ok: true, message: 'ok', accounts: [] }),
      saveSportsDataLogin: async () => ({ ok: true }),
      loginCorrlinks: async () => ({ ok: false, status: {} }),
      getCorrlinksStatus: async () => ({ state: 'idle', message: 'stub' }),
      setCorrBounds: async () => ({}),
      logoutSportsData: async () => ({ ok: true, baseUrl: 'https://sportsdata.com', email: '', hasPassword: false }),
      listAccounts: async () => ({ ok: true, accounts: [] }),
    };
  });
}

for (const vp of VIEWPORTS) {
  test.describe(`Screen7 StatusBar @ ${vp.name}`, () => {
    test(`footer + toast ${vp.width}x${vp.height}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await stubApi(page);
      await page.goto(FILE_URL);
      await page.waitForSelector('.statusbar');

      await page.evaluate(() => {
        const hint = document.getElementById('statusHint');
        hint.textContent =
          'Ready — long status hint that should ellipsize instead of blowing out the footer layout on narrow screens';
        document.getElementById('sdConn').classList.add('on');
        document.getElementById('clConn').classList.add('warn');
        // Inject toast without waiting for auto-remove timing in layout check
        const host = document.getElementById('toastHost');
        const el = document.createElement('div');
        el.className = 'toast error';
        el.id = 'testToast';
        el.textContent =
          'CorrLinks login failed: very long error message that must wrap inside the toast host without leaving the viewport';
        host.appendChild(el);
      });

      const m = await page.evaluate(() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const bar = document.querySelector('.statusbar');
        const credit = document.querySelector('.status-credit');
        const hint = document.querySelector('#statusHint');
        const shortcuts = document.querySelector('.status-hint.shortcuts');
        const pills = [...document.querySelectorAll('.status-pill')];
        const toast = document.querySelector('#testToast');
        const host = document.querySelector('#toastHost');
        const br = bar.getBoundingClientRect();
        const cr = credit.getBoundingClientRect();
        const hr = hint.getBoundingClientRect();
        const tr = toast.getBoundingClientRect();
        const thr = host.getBoundingClientRect();
        return {
          barClipped: br.right > vw + 2 || br.left < -2 || br.bottom > vh + 2,
          creditClipped: cr.right > vw + 2 || cr.left < -2,
          creditText: credit.textContent.trim(),
          hintClipped: hr.right > vw + 2,
          hintOverflowingWithoutEllipsis:
            hint.scrollWidth > hint.clientWidth + 1 &&
            getComputedStyle(hint).textOverflow !== 'ellipsis',
          pills: pills.map((el) => {
            const r = el.getBoundingClientRect();
            return {
              text: el.textContent.trim(),
              clipped: r.right > vw + 2 || r.left < -2,
              h: Math.round(r.height),
            };
          }),
          shortcutsDisplay: shortcuts ? getComputedStyle(shortcuts).display : 'none',
          toastClipped: tr.right > vw + 2 || tr.left < -2 || tr.bottom > vh + 2,
          toastHostW: Math.round(thr.width),
          toastW: Math.round(tr.width),
          barH: Math.round(br.height),
          vw,
        };
      });

      expect(m.barClipped, 'statusbar clipped').toBe(false);
      expect(m.creditClipped, 'credit clipped').toBe(false);
      expect(m.creditText).toContain('Landogz');
      expect(m.hintClipped, 'hint clipped').toBe(false);
      expect(m.hintOverflowingWithoutEllipsis, 'hint needs ellipsis').toBe(false);
      expect(m.toastClipped, 'toast clipped').toBe(false);
      expect(m.toastHostW).toBeLessThanOrEqual(vp.width);
      expect(m.toastW).toBeLessThanOrEqual(vp.width);
      expect(m.barH).toBeGreaterThanOrEqual(32);
      for (const p of m.pills) {
        expect(p.clipped, `pill clipped: ${p.text}`).toBe(false);
      }
      if (vp.width <= 1279) {
        expect(m.shortcutsDisplay).toBe('none');
      }
    });
  });
}
