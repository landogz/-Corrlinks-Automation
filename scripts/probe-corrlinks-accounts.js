#!/usr/bin/env node
/**
 * Probe every unique CorrLinks account on the SportsData list for lock,
 * then print regrouped recipients (no compose / no send).
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { app, BrowserWindow } = require('electron');
const { SportsDataClient } = require('../main/sportsdataClient');
const {
  collectUniqueCorrlinksAccounts,
  regroupInmatesAfterProbe,
  probeUsable,
  emailKey,
  roleLabel,
} = require('../main/loopGroups');
const {
  loginAccount,
  logoutCorrlinksSession,
  setHostWindow,
  forceCloseCorrWindow,
} = require('../main/corrlinksLogin');

function maskEmail(email) {
  const s = String(email || '').trim();
  if (!s) return '(none)';
  const at = s.indexOf('@');
  if (at <= 1) return '***';
  return `${s[0]}***${s.slice(at)}`;
}

const GAP_MS = Number(process.env.PROBE_GAP_MS || 5000);

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const client = new SportsDataClient();
  console.log('Base URL:', client.getConfig().baseUrl);
  console.log('Logging into SportsData…');
  await client.login();

  const result = await client.fetchCorrlinksAccounts();
  const inmates = result.accounts || [];
  const unique = collectUniqueCorrlinksAccounts(inmates);
  console.log(`\nLoaded ${inmates.length} inmate(s) · ${unique.length} unique CorrLinks account(s) to probe\n`);

  const host = new BrowserWindow({
    width: 1100,
    height: 800,
    show: true,
    title: 'CorrLinks account probe',
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  setHostWindow(host);

  /** @type {Map<string, object>} */
  const probeByEmail = new Map();

  for (let i = 0; i < unique.length; i += 1) {
    const account = unique[i];
    const label = maskEmail(account.email);
    const roles = roleLabel(account);
    console.log(`Probe ${i + 1}/${unique.length}: ${label} [${roles}]…`);
    if (account.primaryFor?.length) console.log(`  PRIMARY for: ${account.primaryFor.join('; ')}`);
    if (account.secondFor?.length) console.log(`  SECONDARY for: ${account.secondFor.join('; ')}`);
    let status;
    try {
      status = await loginAccount({
        email: account.email,
        password: account.password,
      });
    } catch (error) {
      status = { state: 'error', message: error.message || String(error), loggedIn: false };
    }
    probeByEmail.set(emailKey(account.email), status);
    const usable = probeUsable(status);
    console.log(
      usable
        ? `  → OK (${status.state}${status.state === 'locked' ? ', session usable' : ''})`
        : `  → FAIL (${status.state || 'error'}${status.message ? `: ${status.message}` : ''})`
    );
    try {
      await logoutCorrlinksSession();
    } catch (_) {
      /* ignore */
    }
    forceCloseCorrWindow();
    if (i < unique.length - 1) await sleep(GAP_MS);
  }

  const { groups, duplicates, skipped } = regroupInmatesAfterProbe(inmates, probeByEmail);
  const usableCount = [...probeByEmail.values()].filter((s) => probeUsable(s)).length;

  console.log('\n========== PROBE RESULTS ==========');
  for (const account of unique) {
    const status = probeByEmail.get(emailKey(account.email));
    const usable = probeUsable(status);
    console.log(
      `${usable ? 'OK  ' : 'FAIL'}  ${maskEmail(account.email)}  [${roleLabel(account)}]  ${status?.state || '?'}` +
        (status?.message && !usable ? ` — ${status.message}` : '')
    );
  }

  console.log('\n========== REGROUPED LOOP PLAN ==========');
  console.log(
    `${usableCount} usable account(s) · ${groups.length} compose group(s) · ` +
      `${groups.reduce((n, g) => n + g.inmates.length, 0)} recipient(s)` +
      (duplicates.length ? ` · ${duplicates.length} duplicate(s)` : '') +
      (skipped.length ? ` · ${skipped.length} skipped` : '')
  );
  console.log('');

  groups.forEach((group, i) => {
    const via = group.via === 'second' ? 'SECONDARY' : 'PRIMARY';
    console.log(`Account ${i + 1}/${groups.length}: ${maskEmail(group.email)} [${via}]`);
    console.log(`  recipients (${group.inmates.length}):`);
    const rows = group.assignments?.length
      ? group.assignments
      : group.inmates.map((inmate) => ({
          name: inmate.name || 'Inmate',
          key: inmate.inmate_id || inmate.id,
          via: group.via,
          usedEmail: group.email,
          primary: inmate.corrlinks_account?.email || null,
          second: inmate.second_corrlinks_account?.email || null,
          primaryState: '—',
          secondState: '—',
        }));
    rows.forEach((row, r) => {
      console.log(`    ${r + 1}. ${row.name} (${row.key})`);
      console.log(
        `       use ${row.via === 'second' ? 'SECONDARY' : 'PRIMARY'} ${maskEmail(row.usedEmail || group.email)}`
      );
      console.log(`       PRIMARY ${maskEmail(row.primary)} = ${row.primaryState}`);
      console.log(
        `       SECONDARY ${row.second ? `${maskEmail(row.second)} = ${row.secondState}` : 'none'}`
      );
    });
    console.log('');
  });

  if (skipped.length) {
    console.log('Skipped (no usable PRIMARY/SECONDARY):');
    for (const row of skipped) {
      console.log(
        `  - ${row.name} (${row.key}) · PRIMARY ${maskEmail(row.primary)}=${row.primaryState}` +
          (row.second
            ? ` · SECONDARY ${maskEmail(row.second)}=${row.secondState}`
            : ' · SECONDARY none')
      );
    }
    console.log('');
  }

  if (duplicates.length) {
    console.log('Duplicates skipped:');
    for (const dup of duplicates) {
      console.log(
        `  - ${dup.name} (${dup.key}) already under ${maskEmail(dup.keptUnder)} — ignored for ${maskEmail(dup.ignoredUnder)}`
      );
    }
  }

  setHostWindow(null);
  if (!host.isDestroyed()) host.destroy();
}

app.whenReady().then(async () => {
  try {
    await run();
    app.exit(0);
  } catch (error) {
    console.error('Probe failed:', error.message || error);
    app.exit(1);
  }
});
