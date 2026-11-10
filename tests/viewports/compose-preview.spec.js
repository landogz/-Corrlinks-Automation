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

const LONG_TO =
  'JULIO ROLON (86311004) · FCI Extremely Long Facility Name For Layout Stress Testing';
const LONG_SUBJECT =
  'Monday sports picks and daily exchange update with extra words to stress truncate';
const LONG_BODY =
  '86311004_julio_rolon_part1_with_a_very_long_filename_for_layout.txt pasted (not sent)';

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
      loginCorrlinks: async () => ({ ok: false, status: { state: 'idle', message: 'stub' } }),
      getCorrlinksStatus: async () => ({ state: 'idle', message: 'stub' }),
      setCorrBounds: async () => ({}),
      logoutSportsData: async () => ({ ok: true, baseUrl: 'https://sportsdata.com', email: '', hasPassword: false }),
      listAccounts: async () => ({ ok: true, accounts: [] }),
      verifySportsDataLogin: async () => ({ ok: true, email: 'operator@example.com' }),
      getUpdateStatus: async () => ({ state: 'dev', currentVersion: '0.1.4', message: 'dev' }),
      onUpdateStatus: () => () => {},
    };
  });
}

async function seedCompose(page, { chars = 12680 } = {}) {
  await page.evaluate(
    ({ to, subject, body, chars }) => {
      document.querySelector('#composeCard')?.classList.remove('collapsed');
      // Prefer public updater if present
      if (typeof window.updateComposePreview === 'function') {
        window.updateComposePreview({ to, subject, body, chars });
        return;
      }
      // Drive via DOM + dispatch by calling through module scope is unavailable;
      // set fields and mimic updateComposePreview side effects for layout checks.
      const previewTo = document.getElementById('previewTo');
      const previewSubject = document.getElementById('previewSubject');
      const previewBody = document.getElementById('previewBody');
      const charCountLabel = document.getElementById('charCountLabel');
      const charProgress = document.getElementById('charProgress');
      const summary = document.getElementById('composeCollapsedSummary');
      const confirmTo = document.getElementById('confirmTo');
      const confirmSubject = document.getElementById('confirmSubject');
      const confirmChars = document.getElementById('confirmChars');
      const btnSend = document.getElementById('btnSend');

      previewTo.textContent = to;
      previewTo.title = to;
      previewSubject.textContent = subject;
      previewBody.textContent = body;
      charCountLabel.textContent = `${chars.toLocaleString()} / 12,750`;
      const pct = Math.min(100, Math.round((chars / 12750) * 100));
      charProgress.style.width = `${pct}%`;
      charProgress.classList.toggle('warn', chars >= 11000 && chars < 12750);
      charProgress.classList.toggle('danger', chars >= 12750);
      summary.textContent = `To ${to.slice(0, 20)}… · ${subject}`;
      summary.title = summary.textContent;
      confirmTo.textContent = to;
      confirmSubject.textContent = subject;
      confirmChars.textContent = `${chars.toLocaleString()} / 12,750`;
      btnSend.disabled = false;
      btnSend.removeAttribute('title');
    },
    { to: LONG_TO, subject: LONG_SUBJECT, body: LONG_BODY, chars }
  );
}

async function layoutMetrics(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const card = document.querySelector('#composeCard');
    const body = document.querySelector('#composeBody');
    const grid = document.querySelector('.preview-inline');
    const send = document.querySelector('#btnSend');
    const meter = document.querySelector('.char-meter');
    const progress = document.querySelector('#charProgress');
    const values = [...document.querySelectorAll('.preview-inline .kv-value')].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        id: el.id,
        text: el.textContent,
        clipped: r.right > vw + 2 || r.left < -2,
        truncated: el.scrollWidth > el.clientWidth + 1,
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    });
    const cells = [...grid.children].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        clipped: r.right > vw + 2,
        w: Math.round(r.width),
        top: Math.round(r.top),
        left: Math.round(r.left),
      };
    });
    const cr = card.getBoundingClientRect();
    const sr = send.getBoundingClientRect();
    const mr = meter.getBoundingClientRect();
    const gr = grid.getBoundingClientRect();
    const cols = getComputedStyle(grid).gridTemplateColumns;
    const colCount = cols.trim().split(/\s+/).filter(Boolean).length;
    // Crush: any preview cell narrower than 90px when multi-col
    const crushed = colCount > 1 && cells.some((c) => c.w < 90);
    return {
      cardClipped: cr.right > vw + 2 || cr.left < -2,
      bodyDisplay: getComputedStyle(body).display,
      collapsed: card.classList.contains('collapsed'),
      gridClipped: gr.right > vw + 2,
      meterClipped: mr.right > vw + 2,
      sendH: Math.round(sr.height),
      sendW: Math.round(sr.width),
      sendClipped: sr.right > vw + 2,
      cols,
      colCount,
      crushed,
      cells,
      values,
      progressW: progress.style.width,
      progressWarn: progress.classList.contains('warn'),
      progressDanger: progress.classList.contains('danger'),
      cardW: Math.round(cr.width),
      vw,
    };
  });
}

for (const vp of VIEWPORTS) {
  test.describe(`Screen4 Compose @ ${vp.name}`, () => {
    test(`preview + meter + send ${vp.width}x${vp.height}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await stubApi(page);
      await page.goto(FILE_URL);
      await page.waitForSelector('#composeCard');
      await seedCompose(page, { chars: 12680 });

      const m = await layoutMetrics(page);
      expect(m.collapsed, 'compose should be open').toBe(false);
      expect(m.bodyDisplay).not.toBe('none');
      expect(m.cardClipped, 'compose card clipped').toBe(false);
      expect(m.gridClipped, 'preview grid clipped').toBe(false);
      expect(m.meterClipped, 'char meter clipped').toBe(false);
      expect(m.sendClipped, 'send button clipped').toBe(false);
      expect(m.sendH, 'send tap target').toBeGreaterThanOrEqual(36);
      expect(m.crushed, `preview columns crushed (${m.cols}, cardW=${m.cardW})`).toBe(false);

      for (const v of m.values) {
        expect(v.clipped, `${v.id} clipped`).toBe(false);
        expect(v.w, `${v.id} width`).toBeGreaterThan(40);
      }

      // Stacked / tablet: single column; desktop CorrLinks column can 3-up
      if (vp.width < 1024) {
        expect(m.colCount, `expected 1 col below 1024 (got ${m.cols})`).toBe(1);
      } else {
        expect(m.colCount, `expected 3 cols at desktop (got ${m.cols})`).toBe(3);
      }

      expect(m.progressWarn || m.progressDanger).toBe(true);
      await expect(page.locator('#previewTo')).toContainText('JULIO');
      await expect(page.locator('#previewSubject')).not.toHaveText('—');
      await expect(page.locator('#charCountLabel')).toContainText('12,680');
    });

    test(`collapsed summary + confirm modal ${vp.width}x${vp.height}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await stubApi(page);
      await page.goto(FILE_URL);
      await page.waitForSelector('#composeCard');
      await seedCompose(page, { chars: 5000 });

      // Collapse via DOM click — Playwright pointer can miss under short landscape + sticky statusbar
      await page.evaluate(() => document.getElementById('btnToggleCompose').click());
      await expect(page.locator('#composeCard')).toHaveClass(/collapsed/);

      const summary = await page.evaluate(() => {
        const el = document.querySelector('#composeCollapsedSummary');
        const r = el.getBoundingClientRect();
        const header = document.querySelector('#btnToggleCompose').getBoundingClientRect();
        const vw = window.innerWidth;
        return {
          clipped: r.right > vw + 2,
          headerClipped: header.right > vw + 2,
          text: el.textContent,
          visible: !!el.offsetParent || getComputedStyle(el).display !== 'none',
        };
      });
      expect(summary.clipped, 'collapsed summary clipped').toBe(false);
      expect(summary.headerClipped, 'compose header clipped').toBe(false);
      expect(summary.text.length).toBeGreaterThan(5);

      // Re-open and show confirm modal
      await page.evaluate(() => document.getElementById('btnToggleCompose').click());
      await page.evaluate(() => {
        document.getElementById('confirmSend').showModal();
      });
      await expect(page.locator('#confirmSend')).toBeVisible();

      const modal = await page.evaluate(() => {
        const dlg = document.getElementById('confirmSend');
        const r = dlg.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const dd = [...dlg.querySelectorAll('dd')].map((el) => {
          const box = el.getBoundingClientRect();
          return {
            clipped: box.right > vw + 2,
            text: el.textContent,
            w: Math.round(box.width),
          };
        });
        const buttons = [...dlg.querySelectorAll('button')].map((el) => {
          const box = el.getBoundingClientRect();
          return { h: Math.round(box.height), w: Math.round(box.width), clipped: box.right > vw + 2 };
        });
        return {
          clipped: r.right > vw + 2 || r.bottom > vh + 2 || r.left < -2,
          w: Math.round(r.width),
          dd,
          buttons,
          vw,
        };
      });
      expect(modal.clipped, 'confirm modal clipped').toBe(false);
      expect(modal.w).toBeLessThanOrEqual(vp.width);
      for (const d of modal.dd) {
        expect(d.clipped, `confirm dd clipped: ${d.text}`).toBe(false);
      }
      for (const b of modal.buttons) {
        expect(b.clipped).toBe(false);
        expect(b.h).toBeGreaterThanOrEqual(32);
      }
      await page.evaluate(() => document.getElementById('confirmSend').close());
    });
  });
}
