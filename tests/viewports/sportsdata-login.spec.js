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
  { name: 'desktop-1920', width: 1920, height: 1080 },
];

async function stubApi(page, { signedIn = false } = {}) {
  await page.addInitScript((signedIn) => {
    window.api = {
      getConfigSummary: async () => ({
        baseUrl: 'https://sportsdata.com',
        email: signedIn ? 'very.long.operator.name+test@sportsdata-example.com' : '',
        password: signedIn ? 'password123' : '',
        hasPassword: signedIn,
        timezone: 'America/New_York',
        subjectToday: 'mon & tue',
        credentialsPath: signedIn ? '/tmp/creds.json' : '',
      }),
      refreshAccounts: async () => ({ ok: true, message: 'ok', accounts: [] }),
      saveSportsDataLogin: async () => ({
        ok: true,
        email: 'operator@example.com',
        remembered: true,
        credentialsPath: '/tmp/creds.json',
      }),
      logoutSportsData: async () => ({
        ok: true,
        baseUrl: 'https://sportsdata.com',
        email: '',
        hasPassword: false,
      }),
      loginCorrlinks: async () => ({ ok: false, status: {} }),
      getCorrlinksStatus: async () => ({ state: 'idle', message: 'stub' }),
      setCorrBounds: async () => ({}),
      listAccounts: async () => ({ ok: true, accounts: [] }),
    };
  }, signedIn);
}

async function metrics(page) {
  return page.evaluate(() => {
    const screen = document.querySelector('#loginScreen');
    const panel = document.querySelector('.login-panel');
    const email = document.querySelector('#sdEmail');
    const password = document.querySelector('#sdPassword');
    const save = document.querySelector('#btnSaveLogin');
    const sr = screen.getBoundingClientRect();
    const pr = panel.getBoundingClientRect();
    const er = email.getBoundingClientRect();
    const pwr = password.getBoundingClientRect();
    const br = save.getBoundingClientRect();
    const vw = window.innerWidth;
    return {
      screenClipped: sr.right > vw + 2 || sr.left < -2,
      panelClipped: pr.right > vw + 2 || pr.left < -2,
      emailW: Math.round(er.width),
      passwordW: Math.round(pwr.width),
      saveH: Math.round(br.height),
      saveW: Math.round(br.width),
      formVisible: getComputedStyle(document.querySelector('#sportsdataForm')).display !== 'none',
      loginVisible: !screen.hidden,
      mainHidden: document.querySelector('#mainShell').hidden,
      inputsFullWidth: Math.abs(er.width - pwr.width) < 4,
      vw,
    };
  });
}

for (const vp of VIEWPORTS) {
  test.describe(`LoginScreen @ ${vp.name}`, () => {
    test(`unsigned form usable ${vp.width}x${vp.height}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await stubApi(page, { signedIn: false });
      await page.goto(FILE_URL);
      await page.waitForSelector('#loginScreen:not([hidden])');

      await expect(page.locator('#mainShell')).toBeHidden();
      await expect(page.locator('#sdEmail')).toBeVisible();
      await expect(page.locator('#sdPassword')).toBeVisible();
      await expect(page.locator('#btnSaveLogin')).toBeVisible();

      const m = await metrics(page);
      expect(m.loginVisible).toBe(true);
      expect(m.mainHidden).toBe(true);
      expect(m.panelClipped, 'login panel clipped').toBe(false);
      expect(m.emailW).toBeGreaterThan(120);
      expect(m.passwordW).toBeGreaterThan(120);
      expect(m.inputsFullWidth, 'email/password widths diverge').toBe(true);
      expect(m.saveH).toBeGreaterThanOrEqual(40);

      await page.fill('#sdEmail', 'extraordinarily.long.operator.email.address+qa@example-domain.com');
      const after = await metrics(page);
      expect(after.panelClipped).toBe(false);
    });

    test(`signed-in shows main + logout ${vp.width}x${vp.height}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await stubApi(page, { signedIn: true });
      await page.goto(FILE_URL);
      await page.waitForSelector('#mainShell:not([hidden])');

      await expect(page.locator('#loginScreen')).toBeHidden();
      await expect(page.locator('#btnLogout')).toBeVisible();
      await expect(page.locator('#btnRefresh')).toBeVisible();
      await expect(page.locator('#stepIndicator .step')).toHaveCount(2);
      await expect(page.locator('#stepIndicator .step[data-step="1"]')).toContainText('Inmate');
      await expect(page.locator('#sportsdataCard')).toHaveCount(0);

      const emailBox = await page.locator('#signedInEmail').boundingBox();
      expect(emailBox.width).toBeGreaterThan(20);
      expect(emailBox.x + emailBox.width).toBeLessThanOrEqual(vp.width + 2);

      await page.locator('#btnLogout').click();
      await expect(page.locator('#loginScreen')).toBeVisible();
      await expect(page.locator('#mainShell')).toBeHidden();
    });
  });
}
