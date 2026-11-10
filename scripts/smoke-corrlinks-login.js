#!/usr/bin/env node
/**
 * Electron smoke: fetch first inmate, login with primary (fallback to second if locked).
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { app } = require('electron');
const { SportsDataClient } = require('../main/sportsdataClient');
const { loginInmate } = require('../main/corrlinksLogin');

async function run() {
  const client = new SportsDataClient();
  console.log('Fetching inmates…');
  const result = await client.fetchCorrlinksAccounts();
  // Prefer the bluetealocean example inmate when present, else any with primary+second.
  const inmate =
    result.accounts.find((a) => a.corrlinks_account?.email === 'bluetealocean29@gmail.com') ||
    result.accounts.find(
      (a) =>
        a.corrlinks_account?.email &&
        a.corrlinks_account?.password &&
        a.second_corrlinks_account?.email &&
        a.second_corrlinks_account?.password
    ) ||
    result.accounts.find((a) => a.corrlinks_account?.email && a.corrlinks_account?.password) ||
    result.accounts[0];
  if (!inmate) {
    throw new Error('No inmate accounts available for smoke test');
  }

  console.log('Using inmate:', {
    id: inmate.id,
    name: inmate.name,
    primary: inmate.corrlinks_account?.email,
    second: inmate.second_corrlinks_account?.email || null,
  });

  const status = await loginInmate(inmate);
  console.log('Final status:', JSON.stringify(status, null, 2));
  await new Promise((r) => setTimeout(r, 5000));
  return status;
}

app.whenReady().then(async () => {
  try {
    const status = await run();
    const ok =
      status.state === 'success' ||
      status.state === 'manual' ||
      status.state === 'locked' ||
      status.state === 'timeout' ||
      status.state === 'rejected';
    app.exit(ok ? 0 : 1);
  } catch (error) {
    console.error('Smoke CorrLinks failed:', error.message);
    app.exit(1);
  }
});
