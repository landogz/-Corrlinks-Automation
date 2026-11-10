#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { app, BrowserWindow } = require('electron');
const { SportsDataClient } = require('../main/sportsdataClient');
const { loginToCorrlinks, getStatus } = require('../main/corrlinksLogin');

app.whenReady().then(async () => {
  try {
    const client = new SportsDataClient();
    const { accounts } = await client.fetchCorrlinksAccounts();
    const account = accounts[0];
    console.log('Account:', account.email, 'pwLen:', account.password.length);

    const status = await loginToCorrlinks({
      email: account.email,
      password: account.password,
    });
    console.log('Status:', JSON.stringify(status, null, 2));
    console.log('getStatus:', JSON.stringify(getStatus(), null, 2));

    await new Promise((r) => setTimeout(r, 8000));
    app.exit(status.state === 'error' ? 1 : 0);
  } catch (e) {
    console.error(e);
    app.exit(1);
  }
});
