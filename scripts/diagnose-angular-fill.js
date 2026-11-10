#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { app, BrowserWindow } = require('electron');
const { SportsDataClient } = require('../main/sportsdataClient');
const { CORRLINKS } = require('../main/config');

app.whenReady().then(async () => {
  const client = new SportsDataClient();
  const { accounts } = await client.fetchCorrlinksAccounts();
  const account = accounts[0];

  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.webContents.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );
  await win.loadURL(CORRLINKS.loginUrl);
  for (let i = 0; i < 60; i += 1) {
    if (await win.webContents.executeJavaScript(`!!document.querySelector('#textbox_0')`, true)) break;
    await new Promise((r) => setTimeout(r, 500));
  }

  const email = account.email;
  const password = account.password;

  // Strategy A: ej2
  let resultA = await win.webContents.executeJavaScript(
    `(() => {
      const emailEl = document.querySelector('#textbox_0');
      const passEl = document.querySelector('#textbox_1');
      emailEl.ej2_instances[0].value = ${JSON.stringify(email)};
      emailEl.ej2_instances[0].dataBind();
      passEl.ej2_instances[0].value = ${JSON.stringify(password)};
      passEl.ej2_instances[0].dataBind();
      return { email: emailEl.value, pwLen: passEl.value.length };
    })()`,
    true
  );
  console.log('A ej2:', resultA);

  // Strategy B: execCommand insertText
  await win.webContents.executeJavaScript(`document.querySelector('#textbox_0').focus(); document.querySelector('#textbox_0').select();`, true);
  await win.webContents.executeJavaScript(
    `document.execCommand('selectAll'); document.execCommand('insertText', false, ${JSON.stringify(email)});`,
    true
  );
  await win.webContents.executeJavaScript(`document.querySelector('#textbox_1').focus(); document.querySelector('#textbox_1').select();`, true);
  await win.webContents.executeJavaScript(
    `document.execCommand('selectAll'); document.execCommand('insertText', false, ${JSON.stringify(password)});`,
    true
  );
  const resultB = await win.webContents.executeJavaScript(
    `({ email: document.querySelector('#textbox_0').value, pwLen: document.querySelector('#textbox_1').value.length, errs: [...document.querySelectorAll('.e-error, .validation-error, .e-float-text, label')].map(e=>e.innerText.trim()).filter(Boolean).slice(0,20) })`,
    true
  );
  console.log('B execCommand:', resultB);

  await win.webContents.executeJavaScript(
    `([...document.querySelectorAll('button')].find(b => /^\\s*login\\s*$/i.test(b.innerText)) || document.querySelector('button.e-primary')).click()`,
    true
  );

  for (let i = 0; i < 20; i += 1) {
    await new Promise((r) => setTimeout(r, 1000));
    const snap = await win.webContents.executeJavaScript(
      `({
        url: location.href,
        text: (document.body.innerText||'').replace(/\\s+/g,' ').trim().slice(0,450),
        toasts: [...document.querySelectorAll('.e-toast-content,.e-toast-message,.e-toast,[role="alert"]')].map(e=>e.innerText.trim()).filter(Boolean)
      })`,
      true
    );
    console.log('t+' + (i + 1) + 's', snap.url, 'toasts=', snap.toasts);
    if (!/\\/login/i.test(snap.url)) {
      console.log('LEFT LOGIN', snap);
      break;
    }
    if (i === 5 || i === 12) console.log('text:', snap.text);
  }

  await new Promise((r) => setTimeout(r, 2000));
  app.exit(0);
});
