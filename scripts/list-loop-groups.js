#!/usr/bin/env node
/**
 * Dry-run: fetch SportsData inmates and print CorrLinks loop groups
 * (one account → many recipients) with cross-account dedupe.
 * No CorrLinks login / no Electron.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { SportsDataClient } = require('../main/sportsdataClient');
const { groupInmatesByCorrlinksAccount } = require('../main/loopGroups');

function maskEmail(email) {
  const s = String(email || '').trim();
  if (!s) return '(none)';
  const at = s.indexOf('@');
  if (at <= 1) return '***';
  return `${s[0]}***${s.slice(at)}`;
}

async function main() {
  const client = new SportsDataClient();
  const cfg = client.getConfig();
  console.log('Base URL:', cfg.baseUrl);
  console.log('Operator:', cfg.email);

  console.log('\nLogging into SportsData…');
  await client.login();

  console.log('Fetching corrlinks-accounts…');
  const result = await client.fetchCorrlinksAccounts();
  const accounts = result.accounts || [];
  console.log(`Loaded ${accounts.length} inmate row(s) (API inmate_count=${result.inmateCount ?? 'n/a'})\n`);

  const { groups, duplicates, skippedNoCreds } = groupInmatesByCorrlinksAccount(accounts);
  const recipientTotal = groups.reduce((n, g) => n + g.inmates.length, 0);

  console.log(
    `Loop plan — ${groups.length} account(s) · ${recipientTotal} recipient(s)` +
      (duplicates.length ? ` · ${duplicates.length} duplicate(s) skipped` : '') +
      (skippedNoCreds ? ` · ${skippedNoCreds} without CorrLinks creds` : '')
  );
  console.log('');

  groups.forEach((group, i) => {
    console.log(`Account ${i + 1}/${groups.length}: ${maskEmail(group.email)}`);
    console.log(
      `  second fallback: ${group.secondEmail ? maskEmail(group.secondEmail) : 'none'}`
    );
    console.log(`  recipients (${group.inmates.length}):`);
    group.inmates.forEach((inmate, r) => {
      const name = inmate.name || 'Inmate';
      const id = inmate.inmate_id || inmate.id || '?';
      console.log(`    ${r + 1}. ${name} (${id})`);
    });
    console.log('');
  });

  if (duplicates.length) {
    console.log('Duplicates skipped:');
    for (const dup of duplicates) {
      console.log(
        `  - ${dup.name} (${dup.key}) already under ${maskEmail(dup.keptUnder)}` +
          ` — ignored for ${maskEmail(dup.ignoredUnder)}`
      );
    }
    console.log('');
  }

  if (!groups.length) {
    console.log('No CorrLinks accounts with credentials to loop.');
  }
}

main().catch((error) => {
  console.error('List failed:', error.message);
  process.exit(1);
});
