#!/usr/bin/env node
const { app, BrowserWindow } = require('electron');
const { CORRLINKS } = require('../main/config');

app.whenReady().then(async () => {
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
    const ready = await win.webContents.executeJavaScript(`!!document.querySelector('#textbox_0')`, true);
    if (ready) break;
    await new Promise((r) => setTimeout(r, 500));
  }

  const info = await win.webContents.executeJavaScript(`(() => {
    const email = document.querySelector('#textbox_0');
    const pass = document.querySelector('#textbox_1');
    function describe(el) {
      if (!el) return null;
      return {
        id: el.id,
        tag: el.tagName,
        ej2: el.ej2_instances ? el.ej2_instances.map(i => i.getModuleName?.() || i.constructor?.name) : null,
        parentEj2: el.parentElement?.ej2_instances ? el.parentElement.ej2_instances.map(i => i.getModuleName?.() || i.constructor?.name) : null,
        angular: !!(el.__ngContext__ || el._ngcontent || el.attributes),
        rect: el.getBoundingClientRect(),
      };
    }

    // Try Syncfusion value set
    let setResult = null;
    try {
      const inst = email.ej2_instances && email.ej2_instances[0];
      if (inst) {
        inst.value = 'test@example.com';
        inst.dataBind?.();
        setResult = { via: 'ej2', value: email.value };
      } else {
        email.value = 'test@example.com';
        email.dispatchEvent(new Event('input', { bubbles: true }));
        setResult = { via: 'native', value: email.value };
      }
    } catch (e) {
      setResult = { error: String(e) };
    }

    return {
      email: describe(email),
      pass: describe(pass),
      setResult,
      keys: Object.keys(email || {}).slice(0, 30),
    };
  })()`, true);

  console.log(JSON.stringify(info, null, 2));
  app.exit(0);
});
