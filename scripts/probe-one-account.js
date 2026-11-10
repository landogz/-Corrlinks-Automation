#!/usr/bin/env node
/**
 * Probe a single CorrLinks email from SportsData (exact or substring match).
 * Usage: npx electron scripts/probe-one-account.js cloudbluesilk25
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const needle = String(process.argv[2] || '')
  .trim()
  .toLowerCase();
if (!needle) {
  console.error('Usage: npx electron scripts/probe-one-account.js <email-or-substring>');
  process.exit(1);
}

const { app, BrowserWindow } = require('electron');
const { SportsDataClient } = require('../main/sportsdataClient');
const { loginAccount, logoutCorrlinksSession, setHostWindow, forceCloseCorrWindow, getStatus } = require('../main/corrlinksLogin');

function maskEmail(email) {
  const s = String(email || '').trim();
  const at = s.indexOf('@');
  if (at <= 1) return '***';
  return `${s.slice(0, Math.min(4, at))}***${s.slice(at)}`;
}

app.whenReady().then(async () => {
  try {
    const client = new SportsDataClient();
    await client.login();
    const { accounts } = await client.fetchCorrlinksAccounts();
    const hit = accounts.find((a) => {
      const p = String(a.corrlinks_account?.email || '').toLowerCase();
      const s = String(a.second_corrlinks_account?.email || '').toLowerCase();
      return p.includes(needle) || s.includes(needle);
    });
    if (!hit) {
      throw new Error(`No inmate with CorrLinks email matching "${needle}"`);
    }

    const primary = hit.corrlinks_account || {};
    const useSecond = String(primary.email || '')
      .toLowerCase()
      .includes(needle)
      ? null
      : hit.second_corrlinks_account;
    const creds = useSecond?.email
      ? { email: useSecond.email, password: useSecond.password, role: 'second' }
      : { email: primary.email, password: primary.password, role: 'primary' };

    console.log('Inmate:', hit.name, `(${hit.inmate_id || hit.id})`);
    console.log('Probing:', maskEmail(creds.email), `[${creds.role}]`);
    console.log('Password length:', (creds.password || '').length);

    const host = new BrowserWindow({
      width: 1100,
      height: 800,
      show: true,
      title: 'CorrLinks single-account probe',
      webPreferences: { contextIsolation: true, nodeIntegration: false },
    });
    setHostWindow(host);

    const status = await loginAccount({
      email: creds.email,
      password: creds.password,
    });
    console.log('\nStatus:', JSON.stringify(status, null, 2));
    console.log('getStatus:', JSON.stringify(getStatus(), null, 2));

    const usable =
      status &&
      (status.state === 'success' || (status.state === 'locked' && status.loggedIn));
    console.log('\nResult:', usable ? 'USABLE' : 'NOT USABLE', `(state=${status?.state})`);

    try {
      await logoutCorrlinksSession();
    } catch (_) {}
    forceCloseCorrWindow();
    setHostWindow(null);
    if (!host.isDestroyed()) host.destroy();
    app.exit(usable ? 0 : 2);
  } catch (error) {
    console.error('Probe failed:', error.message || error);
    app.exit(1);
  }
});
