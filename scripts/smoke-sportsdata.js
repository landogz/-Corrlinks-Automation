#!/usr/bin/env node
/**
 * Smoke-test SportsData session login + corrlinks-accounts fetch (no Electron UI).
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { SportsDataClient } = require('../main/sportsdataClient');

async function main() {
  const client = new SportsDataClient();
  const cfg = client.getConfig();
  console.log('Base URL:', cfg.baseUrl);
  console.log('Operator:', cfg.email);

  console.log('\n1) Logging into SportsData…');
  const login = await client.login();
  console.log('Login OK:', login);

  console.log('\n2) Fetching corrlinks-accounts…');
  const result = await client.fetchCorrlinksAccounts();
  console.log('Message:', result.message);
  console.log('Inmate count:', result.inmateCount);
  console.log('Normalized rows:', result.accounts.length);

  if (result.accounts[0]) {
    const first = result.accounts[0];
    console.log('\nFirst inmate:');
    console.log({
      id: first.id,
      name: first.name,
      inmate_id: first.inmate_id,
      status: first.status,
      primary: first.corrlinks_account?.email,
      hasPrimaryPassword: Boolean(first.corrlinks_account?.password),
      second: first.second_corrlinks_account?.email || null,
      hasSecondPassword: Boolean(first.second_corrlinks_account?.password),
    });
  } else {
    console.log('\nNo inmates returned.');
  }
}

main().catch((error) => {
  console.error('Smoke test failed:', error.message);
  process.exit(1);
});
