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
      saveSportsDataLogin: async () => ({ ok: true, email: 'operator@example.com', remembered: true }),
      loginCorrlinks: async () => ({ ok: false, status: {} }),
      getCorrlinksStatus: async () => ({ state: 'idle', message: 'stub' }),
      setCorrBounds: async () => ({}),
      logoutSportsData: async () => ({
        ok: true,
        baseUrl: 'https://sportsdata.com',
        email: '',
        hasPassword: false,
      }),
      listAccounts: async () => ({ ok: true, accounts: [] }),
    };
  });
}

async function seedLongLogs(page) {
  await page.evaluate(() => {
    const logEl = document.getElementById('log');
    const long =
      'Pasted body part 1: 86311004_julio_rolon_part1_with_a_very_long_filename_for_layout_stress.txt (12,680 chars) — not sent — https://www.corrlinks.com/compose/message?id=999999&token=abcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < 12; i++) {
      const line = document.createElement('div');
      line.className = `log-line ${i % 4 === 0 ? 'error' : i % 3 === 0 ? 'warn' : i % 2 === 0 ? 'success' : 'info'}`;
      line.dataset.level = line.className.split(' ')[1];
      const time = document.createElement('span');
      time.className = 'log-time';
      time.textContent = '3:59:01 PM';
      const msg = document.createElement('div');
      msg.className = 'log-msg';
      msg.textContent = `${i + 1}. ${long}`;
      line.append(time, msg);
      logEl.appendChild(line);
    }
  });
}

for (const vp of VIEWPORTS) {
  test.describe(`Screen5 StatusLog @ ${vp.name}`, () => {
    test(`drawer + long lines ${vp.width}x${vp.height}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await stubApi(page);
      await page.goto(FILE_URL);
      await page.waitForSelector('#mainShell:not([hidden])');
      await expect(page.locator('#logDrawer')).toBeHidden();
      await expect(page.locator('#btnOpenLog')).toBeVisible();

      await page.locator('#btnOpenLog').click();
      await expect(page.locator('#logDrawer')).toBeVisible();
      await seedLongLogs(page);

      const m = await page.evaluate(() => {
        const vw = window.innerWidth;
        const drawer = document.querySelector('#logDrawer');
        const controls = document.querySelector('.log-drawer-controls');
        const log = document.querySelector('#log');
        const lines = [...document.querySelectorAll('.log-line')];
        const dr = drawer.getBoundingClientRect();
        const lr = log.getBoundingClientRect();
        const buttons = [...controls.querySelectorAll('button, select')].map((el) => {
          const r = el.getBoundingClientRect();
          return {
            tag: el.tagName,
            text: (el.textContent || el.value || '').trim().slice(0, 20),
            h: Math.round(r.height),
            clipped: r.right > vw + 2 || r.left < -2,
          };
        });
        const lineMetrics = lines.slice(0, 3).map((el) => {
          const r = el.getBoundingClientRect();
          const msg = el.querySelector('.log-msg');
          const mr = msg.getBoundingClientRect();
          return {
            clipped: r.right > vw + 2,
            msgClipped: mr.right > drawer.getBoundingClientRect().right + 2,
            msgW: Math.round(mr.width),
          };
        });
        return {
          drawerClipped: dr.right > vw + 2 || dr.left < -2,
          logClipped: lr.right > vw + 2,
          logH: Math.round(lr.height),
          drawerW: Math.round(dr.width),
          buttons,
          lineMetrics,
        };
      });

      expect(m.drawerClipped, 'log drawer clipped').toBe(false);
      expect(m.logClipped, 'log body clipped').toBe(false);
      expect(m.logH, 'log readable height').toBeGreaterThanOrEqual(80);
      expect(m.drawerW).toBeGreaterThan(200);
      for (const b of m.buttons) {
        expect(b.clipped, `control clipped: ${b.text}`).toBe(false);
        expect(b.h, `control height: ${b.text}`).toBeGreaterThanOrEqual(28);
      }
      for (const line of m.lineMetrics) {
        expect(line.clipped, 'log line clipped').toBe(false);
        expect(line.msgW, 'log msg width').toBeGreaterThan(80);
      }

      await page.locator('#logFilter').selectOption('error');
      const visibleErrors = await page.evaluate(() =>
        [...document.querySelectorAll('.log-line')].filter((el) => !el.hidden).length
      );
      expect(visibleErrors).toBeGreaterThan(0);

      await page.locator('#btnCloseLog').click();
      await expect(page.locator('#logDrawer')).toBeHidden();
    });
  });
}
