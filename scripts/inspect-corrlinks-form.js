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

  const started = Date.now();
  let info = null;
  while (Date.now() - started < 90000) {
    info = await win.webContents.executeJavaScript(`(() => {
      const inputs = [...document.querySelectorAll('input, button, a')].map((el) => ({
        tag: el.tagName,
        type: el.getAttribute('type'),
        name: el.getAttribute('name'),
        id: el.id,
        className: el.className,
        text: (el.innerText || el.value || '').slice(0, 80),
        aria: el.getAttribute('aria-label'),
      }));
      return {
        url: location.href,
        title: document.title,
        text: (document.body.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 400),
        inputs,
      };
    })()`, true);

    if (info.inputs.some((i) => i.type === 'password') || /just a moment|checking your browser/i.test(info.text)) {
      // keep waiting through CF, break when password appears
      if (info.inputs.some((i) => i.type === 'password')) break;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(JSON.stringify(info, null, 2));
  await new Promise((r) => setTimeout(r, 2000));
  app.exit(0);
});
