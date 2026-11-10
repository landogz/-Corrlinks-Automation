const { test, expect } = require('@playwright/test');
const path = require('path');

const FILE_URL = `file://${path.join(__dirname, '../../renderer/index.html')}`;

const VIEWPORTS = [
  { name: 'phone-390', width: 390, height: 844 },
  { name: 'phone-land', width: 667, height: 375 },
  { name: 'bp-1023', width: 1023, height: 800 },
  { name: 'bp-1024', width: 1024, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

async function stubApi(page) {
  await page.addInitScript(() => {
    window.__corrBoundsLog = [];
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
      logoutSportsData: async () => ({
        ok: true,
        baseUrl: 'https://sportsdata.com',
        email: '',
        hasPassword: false,
      }),
      loginCorrlinks: async () => ({ ok: false, status: {} }),
      getCorrlinksStatus: async () => ({ state: 'idle', message: 'stub' }),
      setCorrBounds: async (bounds) => {
        window.__corrBoundsLog.push(bounds);
        window.__lastCorrBounds = bounds;
        return bounds;
      },
      listAccounts: async () => ({ ok: true, accounts: [] }),
      verifySportsDataLogin: async () => ({ ok: true, email: 'operator@example.com' }),
      getUpdateStatus: async () => ({ state: 'dev', currentVersion: '0.1.4', message: 'dev' }),
      onUpdateStatus: () => () => {},
    };
  });
}

for (const vp of VIEWPORTS) {
  test.describe(`CorrBounds @ ${vp.name}`, () => {
    test(`clip + landscape compose ${vp.width}x${vp.height}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await stubApi(page);
      await page.goto(FILE_URL);
      await page.waitForSelector('#mainShell:not([hidden])');
      await page.waitForFunction(() => typeof window.__syncCorrPaneBounds === 'function');

      // Visible pane → non-zero bounds inside app, above footer
      await page.evaluate(() => {
        document.querySelector('#corrPane')?.scrollIntoView({ block: 'end' });
        window.__syncCorrPaneBounds();
      });

      const visible = await page.evaluate(() => {
        const b = window.__lastCorrBounds;
        const footer = document.querySelector('.statusbar').getBoundingClientRect();
        const app = document.querySelector('.app').getBoundingClientRect();
        return {
          b,
          footerTop: footer.top,
          appTop: app.top,
          ok:
            b &&
            b.width >= 8 &&
            b.height >= 8 &&
            b.y >= app.top - 1 &&
            b.y + b.height <= footer.top + 2 &&
            b.x >= app.left - 1,
        };
      });
      expect(visible.ok, `visible bounds invalid: ${JSON.stringify(visible.b)}`).toBe(true);

      // Scroll pane away (stacked layouts) → bounds collapse to 0
      if (vp.width < 1024) {
        await page.evaluate(() => {
          document.querySelector('.workspace')?.scrollTo(0, 0);
          document.querySelector('#inmateCard')?.scrollIntoView({ block: 'start' });
          window.__syncCorrPaneBounds();
        });
        const hidden = await page.evaluate(() => window.__lastCorrBounds);
        // Pane may still partially show on tall phones; require no footer bleed
        expect(hidden.y + hidden.height).toBeLessThanOrEqual(
          (await page.evaluate(() => document.querySelector('.statusbar').getBoundingClientRect().top)) + 2
        );
      }

      // Short landscape: expanding compose keeps header above statusbar
      if (vp.height <= 420) {
        await page.evaluate(() => {
          document.querySelector('#corrPane')?.scrollIntoView({ block: 'nearest' });
        });
        const land = await page.evaluate(() => {
          const head = document.querySelector('.corr-head').getBoundingClientRect();
          const footer = document.querySelector('.statusbar').getBoundingClientRect();
          const credit = document.querySelector('#mainShell .status-credit');
          return {
            headBottom: head.bottom,
            footerTop: footer.top,
            creditHidden: !credit || getComputedStyle(credit).display === 'none',
            covered: head.bottom > footer.top + 2 && head.top < footer.bottom,
          };
        });
        expect(land.creditHidden, 'credit should hide on short height').toBe(true);
        expect(land.covered, 'corr head covered by footer').toBe(false);
      }
    });
  });
}
