const { test, expect } = require('@playwright/test');
const path = require('path');

const APP = path.join(__dirname, '../../renderer/index.html');
const FILE_URL = `file://${APP}`;

const VIEWPORTS = [
  { name: 'phone-se1', width: 320, height: 568 },
  { name: 'phone-android', width: 360, height: 640 },
  { name: 'phone-se', width: 375, height: 667 },
  { name: 'phone-14', width: 390, height: 844 },
  { name: 'phone-pixel', width: 412, height: 915 },
  { name: 'phone-promax', width: 430, height: 932 },
  { name: 'phone-land-667', width: 667, height: 375 },
  { name: 'phone-land-844', width: 844, height: 390 },
  { name: 'tablet-600', width: 600, height: 960 },
  { name: 'ipad-port', width: 768, height: 1024 },
  { name: 'ipad-air', width: 820, height: 1180 },
  { name: 'ipad-land', width: 1024, height: 768 },
  { name: 'ipad-pro', width: 1024, height: 1366 },
  { name: 'bp-639', width: 639, height: 800 },
  { name: 'bp-640', width: 640, height: 800 },
  { name: 'bp-767', width: 767, height: 800 },
  { name: 'bp-768', width: 768, height: 800 },
  { name: 'bp-1023', width: 1023, height: 800 },
  { name: 'bp-1024', width: 1024, height: 800 },
  { name: 'bp-1099', width: 1099, height: 800 },
  { name: 'bp-1100', width: 1100, height: 800 },
  { name: 'bp-1179', width: 1179, height: 800 },
  { name: 'bp-1180', width: 1180, height: 800 },
  { name: 'bp-1181', width: 1181, height: 800 },
  { name: 'laptop-1280', width: 1280, height: 720 },
  { name: 'laptop-1366', width: 1366, height: 768 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1536', width: 1536, height: 864 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'qhd-2560', width: 2560, height: 1440 },
  { name: 'uw-3440', width: 3440, height: 1440 },
  { name: '4k-3840', width: 3840, height: 2160 },
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
      logoutSportsData: async () => ({ ok: true, baseUrl: 'https://sportsdata.com', email: '', hasPassword: false }),
      listAccounts: async () => ({ ok: true, accounts: [] }),
      verifySportsDataLogin: async () => ({ ok: true, email: 'operator@example.com' }),
      getUpdateStatus: async () => ({ state: 'dev', currentVersion: '0.1.4', message: 'dev' }),
      onUpdateStatus: () => () => {},
      checkForUpdates: async () => ({ ok: false, state: 'dev', currentVersion: '0.1.4' }),
    };
  });
}

async function assertShellLayout(page, width) {
  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const left = document.querySelector('.col-controls');
    const right = document.querySelector('.col-corrlinks');
    const credit = document.querySelector('#mainShell .status-credit');
    const lr = left.getBoundingClientRect();
    const rr = right.getBoundingClientRect();
    const cr = credit.getBoundingClientRect();
    const offenders = [];
    const vw = window.innerWidth;
    for (const el of [
      left,
      right,
      credit,
      document.querySelector('#mainShell .topbar'),
      document.querySelector('#mainShell .statusbar'),
    ]) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.right > vw + 2 || r.left < -2) {
        offenders.push(String(el.className || el.id).slice(0, 60));
      }
    }
    return {
      scrollWidth: doc.scrollWidth,
      innerWidth: vw,
      leftW: Math.round(lr.width),
      rightW: Math.round(rr.width),
      stacked: lr.bottom <= rr.top + 4 || rr.bottom <= lr.top + 4,
      creditVisible: cr.width > 0 && cr.right <= vw + 2 && cr.bottom <= window.innerHeight + 2,
      offenders,
    };
  });

  expect(
    metrics.scrollWidth,
    `overflow scrollWidth=${metrics.scrollWidth} vw=${metrics.innerWidth}`
  ).toBeLessThanOrEqual(metrics.innerWidth + 1);
  expect(metrics.offenders, `clipped chrome: ${metrics.offenders}`).toEqual([]);
  expect(metrics.rightW, 'CorrLinks column crushed').toBeGreaterThan(80);

  if (width < 1024) {
    expect(metrics.stacked, `expected stacked columns at ${width}px`).toBe(true);
  } else {
    expect(metrics.stacked, `expected side-by-side at ${width}px`).toBe(false);
    expect(metrics.leftW).toBeGreaterThan(200);
  }
}

for (const vp of VIEWPORTS) {
  test(`Screen1 shell ${vp.name} ${vp.width}x${vp.height}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await stubApi(page);
    await page.goto(FILE_URL);
    await page.waitForSelector('#mainShell:not([hidden])');
    await expect(page.locator('#mainShell .topbar')).toBeVisible();
    await expect(page.locator('#mainShell .statusbar')).toBeVisible();
    await expect(page.locator('#mainShell .brand-mark')).toBeVisible();
    await expect(page.locator('#stepIndicator .wf-step')).toHaveCount(2);
    if (vp.height > 420) {
      await expect(page.locator('#mainShell .status-credit')).toBeVisible();
      const metrics = await page.evaluate(() => {
        const cr = document.querySelector('#mainShell .status-credit').getBoundingClientRect();
        return cr.width > 0 && cr.right <= window.innerWidth + 2 && cr.bottom <= window.innerHeight + 2;
      });
      expect(metrics, 'footer credit clipped').toBe(true);
    } else {
      await expect(page.locator('#mainShell .status-credit')).toBeHidden();
    }
    await assertShellLayout(page, vp.width);
  });
}
