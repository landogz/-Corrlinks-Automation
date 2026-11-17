#!/usr/bin/env node
/**
 * Dump live CorrLinks login DOM so selectors can be fixed mechanically.
 * Usage: npx electron scripts/diagnose-login-dom.js
 */
const { app, BrowserWindow } = require('electron');
const { CORRLINKS } = require('../main/config');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.webContents.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  try {
    await win.loadURL(CORRLINKS.loginUrl);
  } catch (error) {
    const msg = String(error?.message || error);
    if (!/ERR_ABORTED|-3/.test(msg)) {
      console.error('load failed', msg);
      app.exit(1);
      return;
    }
  }

  let last = null;
  for (let i = 0; i < 40; i += 1) {
    last = await win.webContents.executeJavaScript(
      `(() => {
        const inputs = [...document.querySelectorAll('input, textarea')].map((el, idx) => {
          const r = el.getBoundingClientRect();
          const wrap = el.closest('ejs-textbox, .e-float-input, .e-input-group, .e-control-wrapper, form, label');
          return {
            idx,
            tag: el.tagName,
            id: el.id || null,
            name: el.name || null,
            type: el.type || null,
            autocomplete: el.getAttribute('autocomplete'),
            placeholder: el.placeholder || null,
            aria: el.getAttribute('aria-label'),
            className: String(el.className || '').slice(0, 120),
            disabled: !!el.disabled,
            readOnly: !!el.readOnly,
            valueLen: String(el.value || '').length,
            w: Math.round(r.width),
            h: Math.round(r.height),
            opacity: window.getComputedStyle(el).opacity,
            display: window.getComputedStyle(el).display,
            ej2: (el.ej2_instances || []).map((i) => i.getModuleName?.() || i.constructor?.name || '?'),
            wrapText: String(wrap?.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 80),
          };
        });
        const buttons = [...document.querySelectorAll('button')].map((b) =>
          String(b.innerText || b.textContent || '').replace(/\\s+/g, ' ').trim()
        ).filter(Boolean).slice(0, 12);
        return {
          url: location.href,
          title: document.title || '',
          inputCount: inputs.length,
          textbox0: !!document.querySelector('#textbox_0'),
          textbox1: !!document.querySelector('#textbox_1'),
          ejsTextbox: document.querySelectorAll('ejs-textbox').length,
          passwordType: document.querySelectorAll('input[type="password"]').length,
          emailType: document.querySelectorAll('input[type="email"]').length,
          snippet: String(document.body?.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 280),
          buttons,
          inputs,
        };
      })()`,
      true
    );
    if (last?.inputCount > 0 || /already logged in/i.test(last?.snippet || '')) break;
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(JSON.stringify(last, null, 2));
  app.exit(0);
});
