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
  test.describe(`Screen6 CorrLinksPane @ ${vp.name}`, () => {
    test(`pane + placeholder ${vp.width}x${vp.height}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await stubApi(page);
      await page.goto(FILE_URL);
      await page.waitForSelector('#corrPane');

      // Ensure compose open so pane shares column with preview
      await page.evaluate(() => {
        document.querySelector('#composeCard')?.classList.remove('collapsed');
      });

      // Scroll pane into view — on stacked layouts it starts below the fold
      await page.evaluate(() => {
        document.querySelector('#corrPane')?.scrollIntoView({ block: 'end' });
      });

      const m = await page.evaluate(() => {
        const vw = window.innerWidth;
        const card = document.querySelector('.corr-card');
        const pane = document.querySelector('#corrPane');
        const head = document.querySelector('.corr-head');
        const ph = document.querySelector('.corr-placeholder');
        const compose = document.querySelector('#composeCard');
        const footer = document.querySelector('.statusbar');
        const app = document.querySelector('.app');
        const cr = card.getBoundingClientRect();
        const pr = pane.getBoundingClientRect();
        const hr = head.getBoundingClientRect();
        const phr = ph.getBoundingClientRect();
        const fr = footer.getBoundingClientRect();
        const ar = app.getBoundingClientRect();
        const cor = compose.getBoundingClientRect();
        const paintsOverFooter = pr.bottom > fr.top + 2 && pr.top < fr.bottom - 2;
        return {
          cardClipped: cr.right > vw + 2 || cr.left < -2,
          paneClipped: pr.right > vw + 2 || pr.left < -2,
          headClipped: hr.right > vw + 2,
          placeholderClipped: phr.right > vw + 2,
          paneW: Math.round(pr.width),
          paneH: Math.round(pr.height),
          paneTop: Math.round(pr.top),
          composeBottom: Math.round(cor.bottom),
          paintsOverFooter,
          paneInsideApp: pr.bottom <= ar.bottom + 3,
          placeholderText: ph.textContent.trim(),
          twoCol: getComputedStyle(document.querySelector('.workspace')).gridTemplateColumns
            .trim()
            .split(/\s+/).length >= 2,
        };
      });

      expect(m.cardClipped, 'corr card clipped').toBe(false);
      expect(m.paneClipped, 'corr pane clipped').toBe(false);
      expect(m.headClipped, 'corr head clipped').toBe(false);
      expect(m.placeholderClipped, 'placeholder clipped').toBe(false);
      expect(m.paneW, 'pane width').toBeGreaterThan(140);
      expect(m.paneH, 'pane usable height').toBeGreaterThanOrEqual(120);
      expect(m.paintsOverFooter, 'pane paints over statusbar').toBe(false);
      expect(m.paneInsideApp, 'pane must stay inside .app').toBe(true);
      expect(m.placeholderText.length).toBeGreaterThan(10);

      // Desktop: compose + pane share right column (pane below compose)
      if (vp.width >= 1024) {
        expect(m.twoCol).toBe(true);
        expect(m.paneTop, 'pane should sit below compose').toBeGreaterThanOrEqual(m.composeBottom - 4);
      }
    });
  });
}
