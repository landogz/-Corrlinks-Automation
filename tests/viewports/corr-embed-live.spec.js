const { test, expect } = require('@playwright/test');
const path = require('path');

const FILE_URL = `file://${path.join(__dirname, '../../renderer/index.html')}`;

async function stubApi(page) {
  await page.addInitScript(() => {
    window.__corrBoundsLog = [];
    window.api = {
      getConfigSummary: async () => ({
        baseUrl: 'https://sportsdata.com',
        email: 'operator@example.com',
        password: 'x',
        hasPassword: true,
        remembered: true,
        timezone: 'America/New_York',
        subjectToday: 'mon',
        credentialsPath: '/tmp/creds.json',
      }),
      saveSportsDataLogin: async () => ({
        ok: true,
        email: 'operator@example.com',
        remembered: true,
      }),
      refreshAccounts: async () => ({ ok: true, message: 'ok', accounts: [] }),
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
      warmCorrlinksPanel: async (payload) => ({ ok: true, bounds: payload?.bounds, visible: true }),
      listAccounts: async () => ({ ok: true, accounts: [] }),
      verifySportsDataLogin: async () => ({ ok: true, email: 'operator@example.com' }),
      getUpdateStatus: async () => ({ state: 'dev', currentVersion: '0.1.51', message: 'dev' }),
      onUpdateStatus: () => () => {},
    };
  });
}

test('live loop pane fills the CorrLinks column @ 1440x900', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await stubApi(page);
  await page.goto(FILE_URL);
  await page.waitForSelector('#mainShell:not([hidden])');
  await page.waitForSelector('#corrPane');

  const m = await page.evaluate(() => {
    document.body.classList.add('corr-embed-live');
    document.getElementById('corrPane')?.classList.add('is-live');
    void document.querySelector('.col-corrlinks')?.offsetWidth;
    void document.getElementById('corrPane')?.offsetHeight;
    const col = document.querySelector('.col-corrlinks').getBoundingClientRect();
    const pane = document.getElementById('corrPane').getBoundingClientRect();
    const head = document.querySelector('.corr-head').getBoundingClientRect();
    const footer = document.querySelector('.statusbar').getBoundingClientRect();
    return {
      colW: col.width,
      colH: col.height,
      paneW: pane.width,
      paneH: pane.height,
      paneX: pane.left,
      paneY: pane.top,
      headBottom: head.bottom,
      footerTop: footer.top,
      gapLeft: pane.left - col.left,
      gapRight: col.right - pane.right,
      fillsWidth: pane.width >= col.width * 0.95,
      fillsHeight: pane.height >= (col.bottom - head.bottom) * 0.85,
      underHead: pane.top >= head.bottom - 2,
      aboveFooter: pane.bottom <= footer.top + 4,
    };
  });

  expect(m.fillsWidth, `pane width ${m.paneW} vs col ${m.colW}`).toBe(true);
  expect(m.fillsHeight, `pane height ${m.paneH} vs col ${m.colH}`).toBe(true);
  expect(m.underHead, 'pane must sit under CorrLinks header').toBe(true);
  expect(m.aboveFooter, 'pane must stay above status bar').toBe(true);
  expect(m.gapLeft).toBeLessThan(8);
  expect(m.gapRight).toBeLessThan(8);
});
