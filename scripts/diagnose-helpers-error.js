#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { app, BrowserWindow } = require('electron');
const { CORRLINKS } = require('../main/config');

function buildHelpersBody() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'main', 'corrlinksLogin.js'), 'utf8');
  const start = src.indexOf('function loginDomHelpersScript()');
  const end = src.indexOf('function loginFieldScript()');
  const fnSrc = src.slice(start, end);
  const sandbox = { CORRLINKS, module: { exports: {} }, exports: {}, console };
  vm.runInNewContext(`${fnSrc}\nmodule.exports = loginDomHelpersScript;`, sandbox);
  return sandbox.module.exports();
}

app.whenReady().then(async () => {
  const body = buildHelpersBody();
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    show: false,
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  try {
    await win.loadURL(CORRLINKS.loginUrl);
  } catch (_) {}
  for (let i = 0; i < 30; i += 1) {
    if (await win.webContents.executeJavaScript(`!!document.querySelector('#textbox_0')`, true)) break;
    await new Promise((r) => setTimeout(r, 400));
  }

  const wrapped = `(() => {
    try {
${body}
      return { ok: true, snap: snapshotFields() };
    } catch (e) {
      return {
        ok: false,
        error: String(e && e.message || e),
        stack: String(e && e.stack || '').slice(0, 1200),
      };
    }
  })()`;

  const result = await win.webContents.executeJavaScript(wrapped, true);
  console.log(JSON.stringify(result, null, 2));
  app.exit(result?.ok ? 0 : 2);
});
