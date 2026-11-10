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

const SAMPLE_ACCOUNTS = [
  {
    id: 180,
    name: 'JULIO ROLON',
    inmate_id: '86311004',
    status: 'active',
    corrlinks_account: {
      email: 'bluetealocean29@gmail.com',
      password: 'secret',
    },
    second_corrlinks_account: {
      email: 'purpletapme18@gmail.com',
      password: 'secret',
    },
    inmate_exchange: {
      sendable: [
        { part: 1, filename: '86311004_julio_rolon_part1.txt', characters: 12680, empty: false },
        { part: 2, filename: '86311004_julio_rolon_part2.txt', characters: 8421, empty: false },
        { part: 3, filename: '86311004_julio_rolon_part3.txt', characters: 2100, empty: false },
      ],
      skipped: [{ part: 4, filename: '86311004_julio_rolon_empty.txt', characters: 0, empty: true }],
    },
  },
  {
    id: 215,
    name: 'LUTER EMMANUEL WITH A VERY LONG NAME FOR LAYOUT STRESS',
    inmate_id: '99999999',
    status: 'active',
    corrlinks_account: {
      email: 'extraordinarily.long.corrlinks.primary.address@example-domain.com',
      password: 'secret',
    },
    second_corrlinks_account: null,
    inmate_exchange: { sendable: [], skipped: [] },
  },
];

async function stubApi(page) {
  await page.addInitScript((accounts) => {
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
      refreshAccounts: async () => ({ ok: true, message: 'ok', accounts }),
      saveSportsDataLogin: async () => ({ ok: true, email: 'operator@example.com', remembered: true }),
      loginCorrlinks: async () => ({ ok: false, status: { state: 'idle', message: 'stub' } }),
      getCorrlinksStatus: async () => ({ state: 'idle', message: 'stub' }),
      setCorrBounds: async () => ({}),
      logoutSportsData: async () => ({ ok: true, baseUrl: 'https://sportsdata.com', email: '', hasPassword: false }),
      listAccounts: async () => ({ ok: true, accounts }),
      verifySportsDataLogin: async () => ({ ok: true, email: 'operator@example.com' }),
      getUpdateStatus: async () => ({ state: 'dev', currentVersion: '0.1.4', message: 'dev' }),
      onUpdateStatus: () => () => {},
    };
  }, SAMPLE_ACCOUNTS);
}

async function openInmateList(page) {
  await page.waitForSelector('#inmateSearch:not([disabled])', { timeout: 5000 });
  await page.evaluate(() => {
    document.querySelector('#inmateCard')?.classList.remove('collapsed');
  });
  await page.locator('#inmateSearch').click();
  await page.waitForSelector('#inmateOptions:not([hidden]) .combobox-option[data-id]', {
    timeout: 5000,
  });
}

for (const vp of VIEWPORTS) {
  test.describe(`Screen3 Inmate @ ${vp.name}`, () => {
    test(`combobox + meta layout ${vp.width}x${vp.height}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await stubApi(page);
      await page.goto(FILE_URL);
      await page.waitForSelector('#inmateCard');

      // Wait for auto-refresh to populate (init calls refresh when signed in)
      await page.waitForFunction(() => !document.querySelector('#inmateSearch')?.disabled, null, {
        timeout: 5000,
      });

      await openInmateList(page);
      const options = page.locator('#inmateOptions .combobox-option[data-id]');
      await expect(options).toHaveCount(2);

      const listBox = await page.locator('#inmateOptions').boundingBox();
      expect(listBox.width).toBeGreaterThan(120);
      expect(listBox.x + listBox.width).toBeLessThanOrEqual(vp.width + 2);

      // Select long-name inmate (mousedown handler drives selection)
      await page.locator('#inmateOptions .combobox-option[data-id="215"]').dispatchEvent('mousedown');
      await expect(page.locator('#inmateCard')).not.toHaveClass(/collapsed/);
      await expect(page.locator('#accountMeta')).toBeVisible();

      const layout = await page.evaluate(() => {
        const vw = window.innerWidth;
        const meta = document.querySelector('#accountMeta').getBoundingClientRect();
        const emails = [...document.querySelectorAll('#accountRows .kv-value')].map((el) => {
          const r = el.getBoundingClientRect();
          return {
            text: el.textContent,
            w: Math.round(r.width),
            clipped: r.right > vw + 2,
            truncated: el.scrollWidth > el.clientWidth + 1,
          };
        });
        const login = document.querySelector('#btnLogin').getBoundingClientRect();
        const search = document.querySelector('#inmateSearch').getBoundingClientRect();
        return {
          metaClipped: meta.right > vw + 2,
          emails,
          filesVisible: document.querySelector('#filesBlock')?.hidden !== true,
          fileChecks: document.querySelectorAll('#filesList input[type="checkbox"]').length,
          loginH: Math.round(login.height),
          loginDisabled: document.querySelector('#btnLogin').disabled,
          searchW: Math.round(search.width),
        };
      });

      expect(layout.metaClipped, 'account meta clipped').toBe(false);
      expect(layout.searchW).toBeGreaterThan(140);
      expect(layout.loginH).toBeGreaterThanOrEqual(36);
      expect(layout.loginDisabled).toBe(false);
      expect(layout.filesVisible, 'exchange files list should be visible').toBe(true);
      expect(layout.fileChecks).toBe(0); // long-name inmate has no sendable files
      for (const e of layout.emails) {
        expect(e.clipped, `email clipped: ${e.text}`).toBe(false);
      }
    });

    test(`files list checkboxes + selected keys ${vp.width}x${vp.height}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await stubApi(page);
      await page.goto(FILE_URL);
      await page.waitForFunction(() => !document.querySelector('#inmateSearch')?.disabled, null, {
        timeout: 5000,
      });
      await page.evaluate(() => document.querySelector('#inmateCard')?.classList.remove('collapsed'));

      await openInmateList(page);
      await page.locator('#inmateOptions .combobox-option[data-id="180"]').dispatchEvent('mousedown');
      await expect(page.locator('#accountMeta')).toBeVisible();
      await expect(page.locator('#filesBlock')).toBeVisible();

      const keys = await page.evaluate(() => {
        const hint = document.querySelector('#filesHint')?.textContent || '';
        const checks = [...document.querySelectorAll('#filesList input[type="checkbox"]')];
        return {
          hint,
          filesHidden: document.querySelector('#filesBlock')?.hidden === true,
          checked: checks.filter((c) => c.checked).length,
          total: checks.length,
        };
      });
      expect(keys.filesHidden).toBe(false);
      expect(keys.total).toBe(3);
      expect(keys.checked).toBe(3);
      expect(keys.hint).toMatch(/3 selected/);
    });
  });
}
