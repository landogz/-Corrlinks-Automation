#!/usr/bin/env node
/**
 * Inspect CorrLinks compose "To" dropdown after manual/session login.
 * Usage: keep a logged-in CorrLinks window, or this loads compose (may redirect to login).
 */
const { app, BrowserWindow } = require('electron');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.webContents.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );
  try {
    await win.loadURL('https://www.corrlinks.com/en-US/mailbox/compose');
  } catch (_) {}
  await new Promise((r) => setTimeout(r, 5000));

  const info = await win.webContents.executeJavaScript(`(() => {
    const all = [...document.querySelectorAll('input, select, button, li, .e-multi-select-wrapper, .e-dropdownbase, .e-input-group, [aria-label], label')];
    return {
      url: location.href,
      title: document.title,
      text: (document.body.innerText||'').replace(/\\s+/g,' ').trim().slice(0,800),
      interesting: all.slice(0,80).map(el => ({
        tag: el.tagName,
        id: el.id,
        className: String(el.className).slice(0,120),
        name: el.getAttribute('name'),
        aria: el.getAttribute('aria-label'),
        role: el.getAttribute('role'),
        text: (el.innerText||el.value||'').trim().slice(0,80),
        ej2: el.ej2_instances ? el.ej2_instances.map(i => i.getModuleName?.() || i.constructor?.name) : null,
      })).filter(x => /to|recipient|multi|dropdown|chip|list|select/i.test(JSON.stringify(x))),
    };
  })()`, true);

  console.log(JSON.stringify(info, null, 2));
  await new Promise((r) => setTimeout(r, 2000));
  app.exit(0);
});
