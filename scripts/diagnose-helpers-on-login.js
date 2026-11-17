#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { app, BrowserWindow, BaseWindow, WebContentsView } = require('electron');
const { CORRLINKS } = require('../main/config');

function buildHelpersScript() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'main', 'corrlinksLogin.js'), 'utf8');
  const start = src.indexOf('function loginDomHelpersScript()');
  const end = src.indexOf('function loginFieldScript()');
  const fnSrc = src.slice(start, end);
  const sandbox = { CORRLINKS, module: { exports: {} }, exports: {}, console };
  vm.runInNewContext(`${fnSrc}\nmodule.exports = loginDomHelpersScript;`, sandbox);
  const body = sandbox.module.exports();
  return `(() => {\n${body}\nreturn snapshotFields();\n})()`;
}

app.whenReady().then(async () => {
  const helpers = buildHelpersScript();
  new Function(helpers);

  async function runIn(wc, label) {
    try {
      await wc.loadURL(CORRLINKS.loginUrl);
    } catch (error) {
      const msg = String(error?.message || error);
      if (!/ERR_ABORTED|-3/.test(msg)) throw error;
    }
    let raw = null;
    for (let i = 0; i < 30; i += 1) {
      raw = await wc.executeJavaScript(
        `({ t0: !!document.querySelector('#textbox_0'), n: document.querySelectorAll('input').length, url: location.href })`,
        true
      );
      if (raw.t0) break;
      await new Promise((r) => setTimeout(r, 400));
    }
    const snap = await wc.executeJavaScript(helpers, true).catch((e) => ({ error: String(e) }));
    console.log(label, JSON.stringify({ raw, snap }, null, 2));
  }

  const win = new BrowserWindow({
    width: 1000,
    height: 720,
    show: false,
    webPreferences: { contextIsolation: true, sandbox: true, backgroundThrottling: false },
  });
  await runIn(win.webContents, 'BrowserWindow');

  const host = new BaseWindow({ width: 1280, height: 800, show: false });
  const view = new WebContentsView({
    webPreferences: { contextIsolation: true, sandbox: true, backgroundThrottling: false },
  });
  host.contentView.addChildView(view);
  view.setBounds({ x: 560, y: 80, width: 680, height: 640 });
  await runIn(view.webContents, 'WebContentsView');

  // Parked / off-screen (prepare lock style)
  view.setBounds({ x: 1400, y: 0, width: 720, height: 640 });
  await runIn(view.webContents, 'WebContentsView-parked');

  app.exit(0);
});
