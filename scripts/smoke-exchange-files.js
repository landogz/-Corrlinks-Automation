#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { SportsDataClient } = require('../main/sportsdataClient');

async function main() {
  const client = new SportsDataClient();
  const result = await client.fetchCorrlinksAccounts();
  console.log('Inmates:', result.accounts.length, 'exchangeDate:', result.exchangeDate);

  const withFiles = result.accounts.filter((a) => (a.inmate_exchange?.sendable || []).length);
  const withEmpty = result.accounts.filter((a) => (a.inmate_exchange?.skipped || []).length);
  console.log('With sendable files:', withFiles.length);
  console.log('With skipped empty:', withEmpty.length);

  const sample =
    withFiles.find((a) => (a.inmate_exchange.sendable || []).length > 1) ||
    withFiles[0] ||
    result.accounts[0];

  if (!sample) {
    console.log('No inmates');
    return;
  }

  console.log('\nSample inmate:', sample.name, sample.inmate_id);
  console.log('Sendable:', sample.inmate_exchange?.sendable);
  console.log('Skipped:', sample.inmate_exchange?.skipped);

  const first = sample.inmate_exchange?.sendable?.[0];
  if (!first) {
    console.log('No sendable file to download');
    return;
  }

  console.log('\nDownloading', first.url);
  const file = await client.fetchExchangeFileText(first.url);
  console.log('Downloaded chars:', file.characters);
  console.log('Preview:\n', file.text.slice(0, 240).replace(/\n/g, '\\n'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
