#!/usr/bin/env node
/**
 * Reproduce prepare-pane login using WebContentsView (same host type as the app).
 */
const { app, BaseWindow, WebContentsView } = require('electron');
const { CORRLINKS } = require('../main/config');

app.whenReady().then(async () => {
  const host = new BaseWindow({ width: 1280, height: 800, show: false });
  const view = new WebContentsView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });
  host.contentView.addChildView(view);
  view.setBounds({ x: 560, y: 80, width: 680, height: 640 });
  view.webContents.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/Safari/537.36'
  );

  try {
    await view.webContents.loadURL(CORRLINKS.loginUrl);
  } catch (error) {
    const msg = String(error?.message || error);
    if (!/ERR_ABORTED|-3/.test(msg)) {
      console.error(msg);
      app.exit(1);
      return;
    }
  }

  let raw = null;
  for (let i = 0; i < 30; i += 1) {
    raw = await view.webContents.executeJavaScript(
      `({
        url: location.href,
        n: document.querySelectorAll('input').length,
        t0: !!document.querySelector('#textbox_0'),
        t1: !!document.querySelector('#textbox_1'),
        snippet: String(document.body?.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 160),
      })`,
      true
    );
    if (raw.t0 && raw.t1) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log('raw', JSON.stringify(raw, null, 2));

  const filled = await view.webContents.executeJavaScript(
    `(() => {
      const email = document.querySelector('#textbox_0');
      const pass = document.querySelector('#textbox_1');
      if (!email || !pass) return { ok: false, reason: 'missing' };
      const eInst = email.ej2_instances && email.ej2_instances[0];
      const pInst = pass.ej2_instances && pass.ej2_instances[0];
      if (eInst) { eInst.readonly = false; eInst.value = 'probe@example.com'; eInst.dataBind && eInst.dataBind(); }
      if (pInst) { pInst.readonly = false; pInst.value = 'secret123'; pInst.dataBind && pInst.dataBind(); }
      email.value = 'probe@example.com';
      pass.value = 'secret123';
      email.dispatchEvent(new Event('input', { bubbles: true }));
      pass.dispatchEvent(new Event('input', { bubbles: true }));
      return {
        ok: true,
        email: email.value,
        emailEj: eInst ? String(eInst.value || '') : null,
        passLen: pass.value.length,
        passEjLen: pInst ? String(pInst.value || '').length : null,
      };
    })()`,
    true
  );
  console.log('fill', JSON.stringify(filled, null, 2));

  // Zero-size then restore — does Syncfusion unmount inputs?
  view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
  await new Promise((r) => setTimeout(r, 400));
  const atZero = await view.webContents.executeJavaScript(
    `({ n: document.querySelectorAll('input').length, t0: !!document.querySelector('#textbox_0') })`,
    true
  );
  console.log('atZero', atZero);
  view.setBounds({ x: 560, y: 80, width: 680, height: 640 });
  await new Promise((r) => setTimeout(r, 400));
  const restored = await view.webContents.executeJavaScript(
    `({ n: document.querySelectorAll('input').length, t0: !!document.querySelector('#textbox_0'), email: document.querySelector('#textbox_0')?.value || '' })`,
    true
  );
  console.log('restored', restored);

  app.exit(0);
});
