const { WebContentsView, shell } = require('electron');
const { CORRLINKS } = require('./config');
const { buildCorrlinksSubject } = require('./subject');

let hostWindow = null;
let corrView = null;
let corrAdapter = null;
let corrBounds = { x: 0, y: 0, width: 0, height: 0 };
let lastStatus = {
  state: 'idle',
  message: 'Not started',
  url: null,
  email: null,
  attempt: null,
};

function setHostWindow(win) {
  hostWindow = win && !win.isDestroyed() ? win : null;
}

function setCorrBounds(bounds = {}) {
  corrBounds = {
    x: Math.max(0, Math.round(Number(bounds.x) || 0)),
    y: Math.max(0, Math.round(Number(bounds.y) || 0)),
    width: Math.max(0, Math.round(Number(bounds.width) || 0)),
    height: Math.max(0, Math.round(Number(bounds.height) || 0)),
  };
  if (corrView && hostWindow && !hostWindow.isDestroyed()) {
    try {
      corrView.setBounds(corrBounds);
      if (typeof corrView.setVisible === 'function') {
        corrView.setVisible(corrBounds.width >= 8 && corrBounds.height >= 8);
      }
    } catch (_) {}
  }
  return corrBounds;
}

function getStatus() {
  return { ...lastStatus };
}

const CORR_ZOOM_MIN = 0.7;
const CORR_ZOOM_MAX = 1.5;

function getCorrWebContents() {
  if (!corrView?.webContents || corrView.webContents.isDestroyed()) return null;
  return corrView.webContents;
}

function clampCorrZoom(factor) {
  const n = Number(factor);
  if (!Number.isFinite(n)) return 1;
  return Math.min(CORR_ZOOM_MAX, Math.max(CORR_ZOOM_MIN, n));
}

function reloadCorrlinksPanel() {
  const wc = getCorrWebContents();
  if (!wc) {
    return { ok: false, message: 'No CorrLinks panel is open' };
  }
  try {
    wc.reload();
    return { ok: true, message: 'CorrLinks panel reloaded' };
  } catch (error) {
    return { ok: false, message: error.message || 'Failed to reload CorrLinks panel' };
  }
}

async function openCorrlinksExternal() {
  const wc = getCorrWebContents();
  if (!wc) {
    return { ok: false, message: 'No CorrLinks panel is open' };
  }
  const url = wc.getURL();
  if (!url || url === 'about:blank') {
    const fromStatus = getStatus().url;
    if (!fromStatus) {
      return { ok: false, message: 'No URL loaded in CorrLinks panel' };
    }
    try {
      await shell.openExternal(fromStatus);
      return { ok: true, message: `Opened ${fromStatus} in browser` };
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to open URL externally' };
    }
  }
  try {
    await shell.openExternal(url);
    return { ok: true, message: `Opened ${url} in browser` };
  } catch (error) {
    return { ok: false, message: error.message || 'Failed to open URL externally' };
  }
}

function clearCorrlinksPanelSession() {
  const hadPanel = Boolean(getCorrWebContents());
  forceCloseCorrWindow();
  return {
    ok: true,
    message: hadPanel ? 'CorrLinks panel closed and session view cleared' : 'CorrLinks panel was not open',
  };
}

function zoomCorrlinksPanel(payload = {}) {
  const wc = getCorrWebContents();
  if (!wc) {
    return { ok: false, message: 'No CorrLinks panel is open', zoomFactor: null };
  }
  let factor;
  if (payload.level != null && Number.isFinite(Number(payload.level))) {
    factor = clampCorrZoom(payload.level);
  } else if (payload.delta != null && Number.isFinite(Number(payload.delta))) {
    const current = wc.getZoomFactor();
    factor = clampCorrZoom(current + Number(payload.delta));
  } else {
    return {
      ok: false,
      message: 'Provide { delta: number } or { level: number }',
      zoomFactor: wc.getZoomFactor(),
    };
  }
  try {
    wc.setZoomFactor(factor);
    return { ok: true, zoomFactor: wc.getZoomFactor() };
  } catch (error) {
    return {
      ok: false,
      message: error.message || 'Failed to set zoom',
      zoomFactor: wc.getZoomFactor(),
    };
  }
}

function hasCorrlinksPanelSession() {
  const wc = getCorrWebContents();
  const status = getStatus();
  const url = wc ? wc.getURL() : status.url || null;
  return {
    ok: true,
    active: Boolean(wc),
    url: url && url !== 'about:blank' ? url : status.url || null,
  };
}

function setStatus(partial) {
  lastStatus = { ...lastStatus, ...partial, updatedAt: new Date().toISOString() };
  try {
    if (hostWindow && !hostWindow.isDestroyed() && hostWindow.webContents) {
      hostWindow.webContents.send('corrlinks:status', getStatus());
    }
  } catch (_) {}
  return getStatus();
}

function forceCloseCorrWindow() {
  if (corrView && hostWindow && !hostWindow.isDestroyed()) {
    try {
      hostWindow.contentView.removeChildView(corrView);
    } catch (_) {}
  }
  if (corrView?.webContents && !corrView.webContents.isDestroyed()) {
    try {
      corrView.webContents.close();
    } catch (_) {}
  }
  corrView = null;
  corrAdapter = null;
  setStatus({ state: 'closed', message: 'CorrLinks panel closed' });
}

function getOrCreateWindow() {
  if (!hostWindow || hostWindow.isDestroyed()) {
    throw new Error('Control window is not ready for CorrLinks panel');
  }
  if (corrAdapter && corrView?.webContents && !corrView.webContents.isDestroyed()) {
    setCorrBounds(corrBounds);
    return corrAdapter;
  }

  corrView = new WebContentsView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  corrView.webContents.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );
  hostWindow.contentView.addChildView(corrView);
  // Renderer owns placement via setCorrBounds. Do not invent visible defaults —
  // zero bounds mean intentionally hidden (e.g. loop initializing overlay).
  setCorrBounds(corrBounds);

  corrView.webContents.on('did-navigate', (_event, url) => {
    setStatus({ url });
  });
  corrView.webContents.on('did-navigate-in-page', (_event, url) => {
    setStatus({ url });
  });
  corrView.webContents.on('destroyed', () => {
    corrView = null;
    corrAdapter = null;
  });

  corrAdapter = {
    webContents: corrView.webContents,
    isDestroyed: () => !corrView || !corrView.webContents || corrView.webContents.isDestroyed(),
    show: () => {
      if (hostWindow && !hostWindow.isDestroyed()) hostWindow.show();
      setCorrBounds(corrBounds);
    },
    focus: () => {
      if (hostWindow && !hostWindow.isDestroyed()) hostWindow.focus();
      try {
        corrView.webContents.focus();
      } catch (_) {}
    },
    loadURL: (url, options) => corrView.webContents.loadURL(url, options),
    destroy: () => forceCloseCorrWindow(),
  };

  return corrAdapter;
}

async function inspectPage(win) {
  return win.webContents.executeJavaScript(
    `(() => {
      const text = (document.body && document.body.innerText) ? document.body.innerText : '';
      const lower = text.toLowerCase();
      const hasPassword = !!document.querySelector('input[type="password"]');
      const hasEmail = !!(
        document.querySelector('input[type="email"]') ||
        document.querySelector('#textbox_0') ||
        document.querySelector('input[name="email" i]') ||
        document.querySelector('input[name="username" i]')
      );
      return {
        url: location.href,
        title: document.title || '',
        hasPassword,
        hasEmail,
        hasLoginForm: hasPassword && hasEmail,
        isCloudflare:
          /just a moment|checking your browser|cf-browser-verification|attention required|enable javascript and cookies/i.test(
            lower + ' ' + (document.title || '')
          ) || !!document.querySelector('#challenge-running, #cf-challenge-running, .cf-browser-verification'),
        hasCaptcha: /captcha|recaptcha|hcaptcha|verify you are human/.test(lower),
        hasMfa: /two-factor|verification code|authenticate your|one-time/.test(lower),
        snippet: text.replace(/\\s+/g, ' ').trim().slice(0, 180),
      };
    })()`,
    true
  );
}

async function waitForLoginForm(win, timeoutMs = 90000) {
  const started = Date.now();
  let sawCloudflare = false;

  while (Date.now() - started < timeoutMs) {
    try {
      const info = await inspectPage(win);
      setStatus({
        url: info.url,
        message: info.isCloudflare
          ? 'Waiting for Cloudflare / bot check…'
          : info.hasLoginForm
            ? 'Login form detected'
            : `Waiting for login form… (${info.title || 'loading'})`,
      });

      if (info.hasLoginForm) {
        await new Promise((r) => setTimeout(r, 25));
        return { ok: true, info };
      }

      if (info.isCloudflare || info.hasCaptcha) {
        sawCloudflare = true;
        setStatus({
          state: 'manual',
          message: 'CorrLinks Cloudflare/CAPTCHA challenge — complete it in the window if prompted',
          url: info.url,
        });
      }
    } catch (_) {
      // ignore mid-navigation
    }

    await new Promise((r) => setTimeout(r, 40));
  }

  const finalInfo = await inspectPage(win).catch(() => null);
  return {
    ok: false,
    pendingManual: sawCloudflare,
    info: finalInfo,
    message: sawCloudflare
      ? 'Timed out while Cloudflare/CAPTCHA was showing — complete it manually, then retry login'
      : 'Timed out waiting for CorrLinks login form',
  };
}

function clickAt(win, x, y) {
  const point = { x: Math.round(x), y: Math.round(y) };
  win.webContents.sendInputEvent({ type: 'mouseMove', ...point });
  win.webContents.sendInputEvent({
    type: 'mouseDown',
    ...point,
    button: 'left',
    clickCount: 1,
  });
  win.webContents.sendInputEvent({
    type: 'mouseUp',
    ...point,
    button: 'left',
    clickCount: 1,
  });
}

async function withDebugger(win, fn) {
  const wc = win.webContents;
  const attachedHere = !wc.debugger.isAttached();
  try {
    if (attachedHere) {
      wc.debugger.attach('1.3');
    }
    return await fn(wc);
  } finally {
    if (attachedHere) {
      try {
        wc.debugger.detach();
      } catch (_) {}
    }
  }
}

/** CDP trusted mouse click (better for Syncfusion than sendInputEvent alone). */
async function cdpClick(win, x, y) {
  await withDebugger(win, async (wc) => {
    const point = { x: Math.round(x), y: Math.round(y) };
    await wc.debugger.sendCommand('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: point.x,
      y: point.y,
      buttons: 0,
    });
    await wc.debugger.sendCommand('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: point.x,
      y: point.y,
      button: 'left',
      buttons: 1,
      clickCount: 1,
    });
    await wc.debugger.sendCommand('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: point.x,
      y: point.y,
      button: 'left',
      buttons: 0,
      clickCount: 1,
    });
  });
}

async function cdpTypeIntoFocused(win, text) {
  await withDebugger(win, async (wc) => {
    // Select-all then replace with trusted CDP text insertion (Angular/Syncfusion sees real input).
    const modifier = process.platform === 'darwin' ? 4 : 2; // Meta on macOS, Ctrl elsewhere
    await wc.debugger.sendCommand('Input.dispatchKeyEvent', {
      type: 'keyDown',
      modifiers: modifier,
      key: 'a',
      code: 'KeyA',
      windowsVirtualKeyCode: 65,
    });
    await wc.debugger.sendCommand('Input.dispatchKeyEvent', {
      type: 'keyUp',
      modifiers: modifier,
      key: 'a',
      code: 'KeyA',
      windowsVirtualKeyCode: 65,
    });
    await wc.debugger.sendCommand('Input.insertText', { text: String(text ?? '') });
  });
}

function loginFieldScript() {
  return `(() => {
    function firstMatch(selectors) {
      for (const sel of selectors) {
        try {
          const el = document.querySelector(sel);
          if (el) return el;
        } catch (_) {}
      }
      return null;
    }
    const emailSelectors = ${JSON.stringify(CORRLINKS.emailSelectors)};
    const passwordSelectors = ${JSON.stringify(CORRLINKS.passwordSelectors)};
    const emailInput = firstMatch(emailSelectors);
    const passwordInput = firstMatch(passwordSelectors);
    return {
      emailInput: !!emailInput,
      passwordInput: !!passwordInput,
      email: emailInput ? (emailInput.value || '') : '',
      password: passwordInput ? (passwordInput.value || '') : '',
      emailEj: emailInput?.ej2_instances?.[0]?.value || '',
      passwordEj: passwordInput?.ej2_instances?.[0]?.value || '',
    };
  })()`;
}

async function focusLoginField(win, which) {
  return win.webContents.executeJavaScript(
    `(() => {
      function firstMatch(selectors) {
        for (const sel of selectors) {
          try {
            const el = document.querySelector(sel);
            if (el) return el;
          } catch (_) {}
        }
        return null;
      }
      const selectors = ${JSON.stringify(
        which === 'password' ? CORRLINKS.passwordSelectors : CORRLINKS.emailSelectors
      )};
      const el = firstMatch(selectors);
      if (!el) return { ok: false };
      el.scrollIntoView({ block: 'center', inline: 'center' });
      el.focus();
      el.click();
      try { el.select(); } catch (_) {}
      return { ok: true, id: el.id || null, type: el.type || null };
    })()`,
    true
  );
}

async function syncEj2LoginFields(win, email, password) {
  return win.webContents.executeJavaScript(
    `(() => {
      function firstMatch(selectors) {
        for (const sel of selectors) {
          try {
            const el = document.querySelector(sel);
            if (el) return el;
          } catch (_) {}
        }
        return null;
      }
      function apply(el, value) {
        if (!el) return false;
        const inst = el.ej2_instances && el.ej2_instances[0];
        const proto = window.HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (setter) setter.call(el, value);
        else el.value = value;
        if (inst) {
          inst.value = value;
          if (typeof inst.dataBind === 'function') inst.dataBind();
          try {
            if (typeof inst.trigger === 'function') {
              inst.trigger('input', { value });
              inst.trigger('change', { value });
            }
          } catch (_) {}
        }
        el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: value, inputType: 'insertText' }));
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      const emailInput = firstMatch(${JSON.stringify(CORRLINKS.emailSelectors)});
      const passwordInput = firstMatch(${JSON.stringify(CORRLINKS.passwordSelectors)});
      if (!emailInput || !passwordInput) {
        return { ok: false, reason: 'missing-fields' };
      }
      apply(emailInput, ${JSON.stringify(email)});
      apply(passwordInput, ${JSON.stringify(password)});
      // Blur password last so validators re-run with both values present.
      try { passwordInput.blur(); } catch (_) {}
      try { emailInput.dispatchEvent(new Event('blur', { bubbles: true })); } catch (_) {}
      return {
        ok: true,
        email: emailInput.value || '',
        password: passwordInput.value || '',
        emailEj: emailInput.ej2_instances?.[0]?.value || '',
        passwordEj: passwordInput.ej2_instances?.[0]?.value || '',
      };
    })()`,
    true
  );
}

function credentialsMatch(snapshot, email, password) {
  if (!snapshot) return false;
  const wantEmail = String(email || '');
  const wantPassword = String(password || '');
  const gotEmail = String(snapshot.emailEj || snapshot.email || '');
  const gotPassword = String(snapshot.passwordEj || snapshot.password || '');
  return gotEmail === wantEmail && gotPassword === wantPassword && wantEmail.length > 0 && wantPassword.length > 0;
}

async function fillAndSubmit(win, email, password) {
  const wantEmail = String(email || '').trim();
  const wantPassword = String(password || '');
  if (!wantEmail || !wantPassword) {
    return { ok: false, reason: 'Missing email/password for CorrLinks fill' };
  }

  let filled = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const emailFocus = await focusLoginField(win, 'email');
    if (!emailFocus?.ok) {
      return { ok: false, reason: 'Could not find email field' };
    }
    await cdpTypeIntoFocused(win, wantEmail);
    await new Promise((r) => setTimeout(r, 15));

    const passFocus = await focusLoginField(win, 'password');
    if (!passFocus?.ok) {
      return { ok: false, reason: 'Could not find password field' };
    }
    await cdpTypeIntoFocused(win, wantPassword);
    await new Promise((r) => setTimeout(r, 15));

    filled = await syncEj2LoginFields(win, wantEmail, wantPassword);
    if (credentialsMatch(filled, wantEmail, wantPassword)) break;

    // Re-read DOM in case ej2 lagged.
    const snap = await win.webContents.executeJavaScript(loginFieldScript(), true);
    filled = { ...filled, ...snap };
    if (credentialsMatch(filled, wantEmail, wantPassword)) break;

    await new Promise((r) => setTimeout(r, 25));
  }

  if (!credentialsMatch(filled, wantEmail, wantPassword)) {
    return {
      ok: false,
      reason: 'Fields did not accept values (Angular/Syncfusion still empty)',
      filled,
    };
  }

  // Locate Login button for a trusted CDP click.
  const target = await win.webContents.executeJavaScript(
    `(() => {
      const submitSelectors = ${JSON.stringify(CORRLINKS.submitSelectors)};
      function firstMatch(selectors) {
        for (const sel of selectors) {
          try {
            const el = document.querySelector(sel);
            if (el) return el;
          } catch (_) {}
        }
        return null;
      }
      let submit = firstMatch(submitSelectors);
      if (!submit) {
        submit = [...document.querySelectorAll('button')].find((b) =>
          /^\\s*login\\s*$/i.test((b.innerText || b.textContent || '').trim())
        ) || null;
      }
      if (!submit) return null;
      const r = submit.getBoundingClientRect();
      return {
        text: (submit.innerText || '').trim(),
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
        w: r.width,
        h: r.height,
      };
    })()`,
    true
  );

  if (!target) {
    return { ok: false, reason: 'Could not find Login button', filled };
  }

  // Re-assert values one last time immediately before submit (validators were rejecting empty model).
  await syncEj2LoginFields(win, wantEmail, wantPassword);
  await new Promise((r) => setTimeout(r, 20));

  await cdpClick(win, target.x, target.y);
  await new Promise((r) => setTimeout(r, 30));

  const stillLogin = await win.webContents.executeJavaScript(
    ` /\\/login/i.test(location.pathname || location.href) `,
    true
  );
  if (stillLogin) {
    // If validation toasts already appeared, refill once more and click again.
    const feedback = await readAuthFeedback(win);
    if (feedback?.some((m) => /password field is required|email address field|not a valid email/i.test(m))) {
      await syncEj2LoginFields(win, wantEmail, wantPassword);
      await focusLoginField(win, 'password');
      await cdpTypeIntoFocused(win, wantPassword);
      await syncEj2LoginFields(win, wantEmail, wantPassword);
      await new Promise((r) => setTimeout(r, 20));
    }
    clickAt(win, target.x, target.y);
    await cdpClick(win, target.x, target.y);
    await win.webContents.executeJavaScript(
      `(() => {
        const btn = [...document.querySelectorAll('button')].find((b) =>
          /^\\s*login\\s*$/i.test((b.innerText || '').trim())
        ) || document.querySelector('button.e-primary');
        if (!btn) return false;
        btn.click();
        return true;
      })()`,
      true
    );
  }

  return { ok: true, filled, submitText: target.text, clickedAt: { x: target.x, y: target.y } };
}

function classifyAuthMessage(msg) {
  const lower = String(msg || '').toLowerCase();
  // CorrLinks: "Account locked - Message limit exceeded."
  // Do NOT match bare "locked" — too many false positives on page copy / prior dialogs.
  if (
    /account locked|message limit exceeded|lockout|temporarily (disabled|unavailable)|account (is )?(disabled|suspended|blocked)/i.test(
      lower
    )
  ) {
    return 'locked';
  }
  if (/invalid|incorrect|unsuccessful|failed|not found|try again|unable|required/i.test(lower)) {
    return 'rejected';
  }
  return 'unknown';
}

async function readAuthFeedback(win) {
  return win.webContents.executeJavaScript(
    `(() => {
      const nodes = [...document.querySelectorAll(
        '.e-toast-content, .e-toast-message, .e-error, .e-float-text, .validation-error, .alert-danger, [role="alert"], .e-dlg-content'
      )];
      const messages = [];
      for (const el of nodes) {
        const msg = (el.innerText || '').replace(/\\s+/g, ' ').trim();
        if (!msg || msg.length > 280) continue;
        messages.push(msg);
      }

      // Also scan short visible lock lines near the form (require "account locked" / limit text).
      const body = (document.body && document.body.innerText) ? document.body.innerText : '';
      const lockedMatch = body.match(
        /[^\\n.]{0,40}(account locked|message limit exceeded|lockout|temporarily (disabled|unavailable)|account (is )?(disabled|suspended|blocked))[^\\n.]{0,40}/i
      );
      if (lockedMatch) messages.push(lockedMatch[0].replace(/\\s+/g, ' ').trim());

      return messages;
    })()`,
    true
  );
}

async function readLockDialogMessage(win) {
  // Only trust a *visible* dialog — never scan full body text (stale toasts from a
  // previous account probe were false-flagging the next login as locked).
  return win.webContents.executeJavaScript(
    `(() => {
      const dialogs = [...document.querySelectorAll('.e-dialog, .e-dlg-container, [role="dialog"]')];
      for (const dlg of dialogs) {
        const style = window.getComputedStyle(dlg);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
        const rect = dlg.getBoundingClientRect();
        if (rect.width < 8 || rect.height < 8) continue;
        const text = (dlg.innerText || '').replace(/\\s+/g, ' ').trim();
        if (/account locked|message limit exceeded/i.test(text)) {
          const m = text.match(/Account locked[^\\n]{0,80}|Message limit exceeded[^\\n]{0,40}/i);
          return (m ? m[0] : text).replace(/\\s+/g, ' ').trim().slice(0, 200);
        }
      }
      return null;
    })()`,
    true
  );
}

async function clearAuthToasts(win) {
  try {
    await win.webContents.executeJavaScript(
      `(() => {
        for (const el of document.querySelectorAll('.e-toast-container, .e-toast, [class*="toast"]')) {
          try { el.remove(); } catch (_) {}
        }
        return true;
      })()`,
      true
    );
  } catch (_) {
    /* ignore */
  }
}

/**
 * Close Syncfusion "Validation Error" / Account locked modal (Close button or X).
 */
async function dismissValidationDialog(win, { waitMs = 120 } = {}) {
  // Fast path: most compose opens have no lock dialog — don't spin for seconds.
  const started = Date.now();
  const budget = Math.max(0, Number(waitMs) || 0);
  do {
    const target = await win.webContents.executeJavaScript(
      `(() => {
        const dialogs = [...document.querySelectorAll('.e-dialog, [role="dialog"]')].filter((dlg) => {
          const style = window.getComputedStyle(dlg);
          if (style.display === 'none' || style.visibility === 'hidden') return false;
          return /validation error|account locked|message limit exceeded/i.test(dlg.innerText || '');
        });
        const dlg = dialogs[0];
        if (!dlg) return null;

        const closeBtn =
          [...dlg.querySelectorAll('button')].find((b) => /^\\s*close\\s*$/i.test((b.innerText || '').trim())) ||
          dlg.querySelector('.e-dlg-closeicon-btn, .e-close, button[title="Close"], .e-dlg-header .e-btn');

        if (!closeBtn) return { found: true, hasButton: false };
        const r = closeBtn.getBoundingClientRect();
        return {
          found: true,
          hasButton: true,
          text: (closeBtn.innerText || closeBtn.getAttribute('title') || 'Close').trim(),
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
        };
      })()`,
      true
    );

    if (!target) {
      if (Date.now() - started >= budget) return { dismissed: false };
      await new Promise((r) => setTimeout(r, 25));
      continue;
    }

    if (target.hasButton && target.x != null) {
      clickAt(win, target.x, target.y);
      await new Promise((r) => setTimeout(r, 15));
    }

    await win.webContents.executeJavaScript(
      `(() => {
        const dialogs = [...document.querySelectorAll('.e-dialog, [role="dialog"]')];
        for (const dlg of dialogs) {
          if (!/validation error|account locked|message limit exceeded/i.test(dlg.innerText || '')) continue;
          const btn =
            [...dlg.querySelectorAll('button')].find((b) => /^\\s*close\\s*$/i.test((b.innerText || '').trim())) ||
            dlg.querySelector('.e-dlg-closeicon-btn, .e-close, button[title="Close"]');
          if (btn) {
            btn.click();
            return true;
          }
          const inst = dlg.ej2_instances && dlg.ej2_instances[0];
          if (inst && typeof inst.hide === 'function') {
            inst.hide();
            return true;
          }
        }
        return false;
      })()`,
      true
    );

    await new Promise((r) => setTimeout(r, 25));
    const stillOpen = await readLockDialogMessage(win);
    if (!stillOpen) {
      return { dismissed: true };
    }
  } while (Date.now() - started < Math.max(budget, 2000));

  return { dismissed: false };
}

async function settlePostLogin(win) {
  await new Promise((r) => setTimeout(r, 40));
  let lockMessage = await readLockDialogMessage(win);
  // Detect lock quickly so we can fall back to the second account without downtime.
  const dismiss = await dismissValidationDialog(win, { waitMs: lockMessage ? 250 : 120 });
  if (!lockMessage) {
    lockMessage = await readLockDialogMessage(win);
  }
  return { lockMessage, dismiss };
}

const SEND_SUCCESS_DIALOG_JS = `(() => {
  function isReallyVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    if (el.classList.contains('e-popup-close') || el.classList.contains('e-dlg-close')) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 40) return false;
    if (r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth) return false;
    return true;
  }
  const dialogs = [...document.querySelectorAll('.e-dialog, [role="dialog"]')].filter((dlg) => {
    if (!isReallyVisible(dlg)) return false;
    const text = String(dlg.innerText || dlg.textContent || '');
    return /message successfully sent/i.test(text);
  });
  const dlg = dialogs[0];
  if (!dlg) return null;
  const okBtn =
    [...dlg.querySelectorAll('button, input[type="button"], a.e-btn, .e-btn, [role="button"]')].find((b) =>
      /^\\s*ok\\s*$/i.test(String(b.innerText || b.value || '').trim())
    ) ||
    dlg.querySelector('.e-footer-content button, .e-dlg-footer button, button.e-primary');
  if (!okBtn || !isReallyVisible(okBtn)) {
    return { found: true, hasButton: false, text: (dlg.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 120) };
  }
  const r = okBtn.getBoundingClientRect();
  return {
    found: true,
    hasButton: true,
    text: (dlg.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 120),
    btn: String(okBtn.innerText || okBtn.value || 'OK').trim(),
    x: r.left + r.width / 2,
    y: r.top + r.height / 2,
  };
})()`;

/**
 * CorrLinks shows Syncfusion dialog: "Send Message" / "Message successfully sent." + OK.
 * waitMs=0 → single peek (no downtime). After Send, pass a short wait budget.
 */
async function dismissSendSuccessDialog(win, { waitMs = 0 } = {}) {
  const started = Date.now();
  const budget = Math.max(0, Number(waitMs) || 0);
  do {
    const target = await win.webContents.executeJavaScript(SEND_SUCCESS_DIALOG_JS, true).catch(() => null);

    if (!target?.found) {
      if (Date.now() - started >= budget) break;
      await new Promise((r) => setTimeout(r, 25));
      continue;
    }

    if (target.hasButton && target.x != null) {
      clickAt(win, target.x, target.y);
      await cdpClick(win, target.x, target.y).catch(() => {});
    }

    await win.webContents.executeJavaScript(
      `(() => {
        function isReallyVisible(el) {
          if (!el) return false;
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
          if (el.getAttribute('aria-hidden') === 'true') return false;
          const r = el.getBoundingClientRect();
          return r.width >= 40 && r.height >= 40;
        }
        const dialogs = [...document.querySelectorAll('.e-dialog, [role="dialog"]')];
        for (const dlg of dialogs) {
          if (!isReallyVisible(dlg)) continue;
          const text = String(dlg.innerText || dlg.textContent || '');
          if (!/message successfully sent/i.test(text)) continue;
          const okBtn =
            [...dlg.querySelectorAll('button, input[type="button"], a.e-btn, .e-btn')].find((b) =>
              /^\\s*ok\\s*$/i.test(String(b.innerText || b.value || '').trim())
            ) ||
            dlg.querySelector('.e-footer-content button, .e-dlg-footer button, button.e-primary');
          if (okBtn) {
            try { okBtn.focus(); } catch (_) {}
            okBtn.click();
            return { ok: true, via: 'click' };
          }
          const inst = dlg.ej2_instances && dlg.ej2_instances[0];
          if (inst && typeof inst.hide === 'function') {
            inst.hide();
            return { ok: true, via: 'hide' };
          }
        }
        return { ok: false };
      })()`,
      true
    ).catch(() => ({ ok: false }));

    await new Promise((r) => setTimeout(r, 30));
    return { dismissed: true, success: true, text: target.text || 'Message successfully sent.' };
  } while (Date.now() - started < budget);

  return { dismissed: false, success: false };
}

/** First meaningful line of body — used to confirm which file was sent. */
function bodyFingerprint(text) {
  const line = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0) || '';
  return line.slice(0, 80);
}

async function readComposeBodyState(win) {
  return win.webContents.executeJavaScript(
    `(() => {
      const body = document.querySelector(
        'textarea, .e-richtexteditor [contenteditable="true"], [contenteditable="true"]'
      );
      if (!body) return { length: 0, head: '', via: 'missing' };
      const text = String(body.value != null && body.value !== '' ? body.value : (body.innerText || ''));
      const trimmed = text.trim();
      const head = trimmed.split(/\\r?\\n/).find((l) => l.trim()) || '';
      return { length: trimmed.length, head: head.slice(0, 80), via: body.tagName.toLowerCase() };
    })()`,
    true
  ).catch(() => ({ length: 0, head: '', via: 'error' }));
}

/**
 * Do not click Send until the compose body actually holds the pasted file.
 * Prevents “part 1 missed” when Send fires before Angular binds the text.
 */
async function waitForComposeBodyReady(win, expectedText, timeoutMs = 6000) {
  const expected = String(expectedText || '');
  const need = Math.max(1, Math.floor(expected.trim().length * 0.92));
  const expectHead = bodyFingerprint(expected);
  const started = Date.now();
  let last = null;
  while (Date.now() - started < timeoutMs) {
    last = await readComposeBodyState(win);
    const headOk = !expectHead || !last?.head || last.head.startsWith(expectHead.slice(0, 24));
    if (last?.length >= need && headOk) {
      return { ok: true, ...last, expected: expected.trim().length };
    }
    await new Promise((r) => setTimeout(r, 40));
  }
  return {
    ok: false,
    reason: `Body not ready before Send (have ${last?.length || 0}, need ~${need})`,
    ...last,
    expected: expected.trim().length,
  };
}

async function waitForLoginResult(win, timeoutMs = 45000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const url = win.webContents.getURL();
    setStatus({ url });

    const leftLogin = url && !CORRLINKS.loginPathPattern.test(url);
    if (leftLogin) {
      // Dashboard can still show "Account locked" Validation Error — dismiss it.
      const settled = await settlePostLogin(win);
      if (settled.lockMessage) {
        return {
          ok: false,
          locked: true,
          loggedIn: true,
          url,
          message: settled.lockMessage,
          dialogDismissed: settled.dismiss?.dismissed === true,
        };
      }
      return {
        ok: true,
        url,
        message: 'Navigated away from login page',
        dialogDismissed: settled.dismiss?.dismissed === true,
      };
    }

    const pageSignal = await inspectPage(win).catch(() => null);
    if (pageSignal?.hasCaptcha || pageSignal?.hasMfa || pageSignal?.isCloudflare) {
      return {
        ok: false,
        pendingManual: true,
        url,
        message: pageSignal.hasMfa
          ? 'CorrLinks showed MFA/verification — complete it in the window'
          : 'CorrLinks showed a bot/CAPTCHA challenge — complete it in the window',
        signal: pageSignal,
      };
    }

    // Visible lock dialog only (body-wide scans caused cross-account false positives).
    const visibleLock = await readLockDialogMessage(win);
    if (visibleLock) {
      await dismissValidationDialog(win);
      return { ok: false, locked: true, url, message: visibleLock };
    }

    // Toast/alert messages are OK here because we clear toasts before each login submit.
    const messages = await readAuthFeedback(win).catch(() => []);
    for (const msg of messages) {
      if (classifyAuthMessage(msg) === 'locked') {
        await dismissValidationDialog(win);
        return { ok: false, locked: true, url, message: msg };
      }
    }
    for (const msg of messages) {
      if (classifyAuthMessage(msg) === 'rejected') {
        return { ok: false, locked: false, url, message: msg };
      }
    }

    await new Promise((r) => setTimeout(r, 50));
  }

  return {
    ok: false,
    url: win.webContents.getURL(),
    message: 'Timed out waiting for CorrLinks login navigation (window left open for manual check)',
  };
}

async function clearCorrlinksSession(win) {
  try {
    const ses = win.webContents.session;
    await ses.clearStorageData({
      origin: 'https://www.corrlinks.com',
      storages: ['cookies', 'localstorage', 'sessionstorage', 'indexdb', 'cachestorage'],
    });
  } catch (_) {
    // best-effort
  }
}

function withTimeout(promise, ms, label = 'timeout') {
  let timer;
  return Promise.race([
    Promise.resolve(promise).finally(() => {
      if (timer) clearTimeout(timer);
    }),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(label)), ms);
    }),
  ]);
}

/**
 * Detect CorrLinks "You are already logged in as email@…" interstitial.
 * Always time-bounded — blank/unloaded webContents must not hang the app.
 */
async function detectAlreadyLoggedIn(win) {
  try {
    if (!win?.webContents || win.webContents.isDestroyed()) {
      return { already: false };
    }
    const url = win.webContents.getURL();
    if (!url || url === 'about:blank' || url.startsWith('data:')) {
      return { already: false, via: 'blank' };
    }
    return await withTimeout(
      win.webContents.executeJavaScript(
        `(() => {
          const text = (document.body && document.body.innerText) ? document.body.innerText : '';
          const m = text.match(/already logged in as\\s*([^\\n.]+)/i);
          if (!m) {
            const hasLoginFields = !!document.querySelector('input[type="password"], #textbox_1');
            const onAuthArea = /\\/(dashboard|mailbox)\\b/i.test(location.href);
            if (onAuthArea && !hasLoginFields) {
              return { already: true, email: null, via: 'url', url: location.href };
            }
            return { already: false };
          }
          const email = (m[1] || '').trim().replace(/\\s+/g, '');
          return { already: true, email, via: 'message', url: location.href, snippet: text.replace(/\\s+/g, ' ').trim().slice(0, 180) };
        })()`,
        true
      ),
      8000,
      'detectAlreadyLoggedIn timeout'
    );
  } catch (_) {
    return { already: false };
  }
}

/**
 * Leave an existing CorrLinks session so we can log in as the target account.
 * Clear storage first (fast), then brief UI logout attempt — no multi-second sleeps.
 */
async function forceLogoutExistingSession(win) {
  setStatus({ state: 'logout', message: 'Switching CorrLinks account — clearing session…' });

  // Clear cookies/storage first so we don't wait on slow UI logout.
  await clearCorrlinksSession(win);

  // Best-effort UI logout (non-blocking delay).
  await win.webContents.executeJavaScript(
    `(() => {
      const menuBtn =
        document.querySelector('#e-dropdown-btn_2') ||
        document.querySelector('button[aria-label="dropdownbutton"]') ||
        [...document.querySelectorAll('button')].find((b) => /account|profile|user/i.test(b.innerText || b.getAttribute('aria-label') || ''));
      if (menuBtn) menuBtn.click();
      const links = [...document.querySelectorAll('a, button, span, li')];
      const logout = links.find((el) => /^\\s*log\\s*out\\s*$/i.test((el.innerText || '').trim()));
      if (logout) {
        logout.click();
        return 'ui-logout';
      }
      return 'no-ui-logout';
    })()`,
    true
  ).catch(() => 'no-ui-logout');

  await new Promise((r) => setTimeout(r, 30));
  await clearCorrlinksSession(win);

  try {
    await win.loadURL(CORRLINKS.loginUrl);
  } catch (error) {
    const msg = String(error?.message || error);
    if (!/ERR_ABORTED|-3/.test(msg)) throw error;
  }
  await new Promise((r) => setTimeout(r, 40));

  // If still "already logged in", clear again and hard-reload login.
  const again = await detectAlreadyLoggedIn(win).catch(() => null);
  if (again?.already) {
    await clearCorrlinksSession(win);
    try {
      await win.loadURL(CORRLINKS.loginUrl);
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 40));
  }

  return { ok: true };
}

async function loadLoginPage(win, { clearSession = false } = {}) {
  if (clearSession) {
    await clearCorrlinksSession(win);
  }
  // Cloudflare / SPA redirects often abort the first navigation (-3 ERR_ABORTED)
  // even when the final login page still renders. Treat abort as soft failure.
  try {
    await win.loadURL(CORRLINKS.loginUrl);
  } catch (error) {
    const msg = String(error?.message || error);
    if (!/ERR_ABORTED|-3/.test(msg)) {
      throw error;
    }
  }
  await new Promise((r) => setTimeout(r, 40));
}

function normalizeRecipientNeedle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** CorrLinks shows "ROLON JULIO (86311004)" while SportsData may be "JULIO ROLON". */
function recipientFilterTokens(recipientName, inmateId) {
  const tokens = [];
  if (inmateId) tokens.push(String(inmateId).trim());
  const parts = normalizeRecipientNeedle(recipientName).split(' ').filter((p) => p.length > 1);
  // Prefer last token (often surname) for filter box: ROLON
  if (parts.length) tokens.push(parts[parts.length - 1]);
  if (recipientName) tokens.push(String(recipientName).trim());
  return [...new Set(tokens.filter(Boolean))];
}

/** Success = To field chip/text contains inmate id (or all name parts). */
async function verifyToRecipientSelected(win, { recipientName, inmateId }) {
  return win.webContents.executeJavaScript(
    `(() => {
      const needleId = ${JSON.stringify(normalizeRecipientNeedle(inmateId))};
      const parts = ${JSON.stringify(normalizeRecipientNeedle(recipientName))}.split(' ').filter((p) => p.length > 1);

      const multi =
        document.querySelector('.e-multiselect') ||
        document.querySelector('.e-multi-select-wrapper');
      const multiInst = multi?.ej2_instances?.[0];
      const multiValue = multiInst?.value;
      const multiText = multiInst?.text || multiInst?.chipCollection?.innerText || '';

      const chipNodes = [...document.querySelectorAll(
        '.e-multiselect .e-chips, .e-multi-select-wrapper .e-chips, .e-chipcontent, .e-delim-view, .e-remain'
      )];
      const chips = chipNodes.map((el) => (el.innerText || '').replace(/\\s+/g, ' ').trim()).filter(Boolean);
      const wrapperText = ((multi && multi.innerText) || '').replace(/\\s+/g, ' ').trim();
      const blob = [chips.join(' '), wrapperText, String(multiText || ''), JSON.stringify(multiValue || '')]
        .join(' ')
        .toLowerCase();

      const idOk = !!(needleId && blob.includes(needleId));
      const nameOk = !!(parts.length >= 2 && parts.every((p) => blob.includes(p)));
      const checkedInRow = (() => {
        if (!needleId) return false;
        const rows = [...document.querySelectorAll('tr.e-row, table tbody tr, .e-list-item')];
        for (const row of rows) {
          const t = (row.innerText || '').toLowerCase();
          if (!t.includes(needleId)) continue;
          const input = row.querySelector('input[type="checkbox"]');
          if (input?.checked) return true;
          if (row.querySelector('.e-check, .e-icons.e-frame.e-check, [aria-checked="true"]')) return true;
        }
        return false;
      })();

      return {
        ok: idOk || nameOk || checkedInRow,
        idOk,
        nameOk,
        checkedInRow,
        chips: chips.slice(0, 8),
        wrapperText: wrapperText.slice(0, 200),
        multiValue,
      };
    })()`,
    true
  );
}

async function openToPickerAndFilter(win, filterText) {
  return win.webContents.executeJavaScript(
    `(() => {
      const filterText = ${JSON.stringify(filterText || '')};
      const host =
        document.querySelector('.e-multiselect') ||
        document.querySelector('.e-multi-select-wrapper');
      if (!host) return { ok: false, reason: 'Could not find To dropdown' };
      const input = host.querySelector('input') || document.querySelector('.e-multiselect input');
      const inst = host.ej2_instances?.[0] || input?.ej2_instances?.[0];

      if (inst?.showPopup) inst.showPopup();
      else if (input) { input.focus(); input.click(); }
      else host.click();

      if (input && filterText) {
        input.focus();
        input.select?.();
        const proto = window.HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (setter) setter.call(input, filterText);
        else input.value = filterText;
        input.dispatchEvent(new InputEvent('input', { bubbles: true, data: filterText, inputType: 'insertText' }));
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a' }));
      }
      try { inst?.filter?.(filterText); } catch (_) {}
      return { ok: true, filterText, hasInstance: !!inst };
    })()`,
    true
  );
}

async function locateRecipientClickTarget(win, { recipientName, inmateId }) {
  return win.webContents.executeJavaScript(
    `(() => {
      const needleId = ${JSON.stringify(normalizeRecipientNeedle(inmateId))};
      const needleName = ${JSON.stringify(normalizeRecipientNeedle(recipientName))};
      const parts = needleName.split(' ').filter((p) => p.length > 1);
      function norm(s) {
        return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      }
      function score(text) {
        const n = norm(text);
        let s = 0;
        if (needleId && n.includes(needleId)) s += 10;
        if (parts.length && parts.every((p) => n.includes(p))) s += 5;
        return s;
      }

      const rows = [...document.querySelectorAll(
        '.e-gridcontent tr.e-row, .e-grid .e-row, .e-popup table tbody tr, .e-popup .e-list-item, .e-checkbox-wrapper, li.e-list-item'
      )];
      let best = null;
      let bestScore = 0;
      for (const el of rows) {
        const text = (el.innerText || '').replace(/\\s+/g, ' ').trim();
        if (text.length < 3) continue;
        const sc = score(text);
        if (sc > bestScore) {
          bestScore = sc;
          best = el;
        }
      }
      if (!best || bestScore <= 0) {
        return { ok: false, reason: 'Recipient row not found', rowCount: rows.length };
      }
      best.scrollIntoView({ block: 'center', inline: 'nearest' });

      const checkboxCell =
        best.querySelector('td.e-gridchkbox, .e-gridchkbox, td:first-child') || best;
      const frame =
        checkboxCell.querySelector('.e-icons.e-frame') ||
        checkboxCell.querySelector('.e-checkbox-wrapper') ||
        checkboxCell.querySelector('input[type="checkbox"]') ||
        checkboxCell;
      const nameCell =
        [...best.querySelectorAll('td, .e-rowcell, span, div')].find((n) => /\\(\\d{5,}\\)/.test(n.innerText || '')) ||
        best;

      const fr = frame.getBoundingClientRect();
      const nr = nameCell.getBoundingClientRect();
      return {
        ok: true,
        selected: (best.innerText || '').replace(/\\s+/g, ' ').trim(),
        score: bestScore,
        points: [
          { x: fr.left + Math.min(12, Math.max(6, fr.width / 2)), y: fr.top + fr.height / 2, kind: 'checkbox' },
          { x: nr.left + Math.min(40, nr.width / 2), y: nr.top + nr.height / 2, kind: 'name' },
        ],
      };
    })()`,
    true
  );
}

async function trySyncfusionSelectRecipient(win, { recipientName, inmateId }) {
  return win.webContents.executeJavaScript(
    `(() => {
      const needleId = ${JSON.stringify(normalizeRecipientNeedle(inmateId))};
      const needleName = ${JSON.stringify(normalizeRecipientNeedle(recipientName))};
      const parts = needleName.split(' ').filter((p) => p.length > 1);
      function norm(s) {
        return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      }
      function score(obj) {
        const n = norm(typeof obj === 'string' ? obj : JSON.stringify(obj));
        let s = 0;
        if (needleId && n.includes(needleId)) s += 10;
        if (parts.length && parts.every((p) => n.includes(p))) s += 5;
        return s;
      }

      const nodes = [...document.querySelectorAll('.e-grid, .e-multiselect, .e-popup, .e-dialog, body *')];
      const grids = [];
      const multis = [];
      for (const el of nodes) {
        const list = el.ej2_instances || [];
        for (const inst of list) {
          const name = String(inst.getModuleName?.() || inst.constructor?.name || '').toLowerCase();
          if (name.includes('grid') || typeof inst.selectCheckboxes === 'function' || typeof inst.selectRow === 'function') {
            grids.push(inst);
          }
          if (name.includes('multiselect') || Array.isArray(inst.value) || typeof inst.showPopup === 'function') {
            multis.push(inst);
          }
        }
      }

      for (const grid of grids) {
        try {
          const rows = grid.getRows?.() || [];
          const recs = grid.getCurrentViewRecords?.() || [];
          let bestIdx = -1;
          let bestScore = 0;
          let label = '';
          const n = Math.max(rows.length, recs.length);
          for (let i = 0; i < n; i += 1) {
            const text = rows[i] ? (rows[i].innerText || '') : JSON.stringify(recs[i] || '');
            const sc = Math.max(score(text), score(recs[i] || ''));
            if (sc > bestScore) {
              bestScore = sc;
              bestIdx = i;
              label = (rows[i]?.innerText || '').replace(/\\s+/g, ' ').trim();
            }
          }
          if (bestIdx < 0 || bestScore <= 0) continue;

          grid.clearSelection?.();
          if (typeof grid.selectCheckboxes === 'function') grid.selectCheckboxes([bestIdx]);
          else if (typeof grid.selectRow === 'function') grid.selectRow(bestIdx, false);
          else if (typeof grid.selectRows === 'function') grid.selectRows([bestIdx]);

          // Fire checkbox column click handler if present
          const row = rows[bestIdx];
          const frame = row?.querySelector?.('.e-icons.e-frame, .e-checkbox-wrapper, input[type="checkbox"]');
          frame?.click?.();

          const selected = grid.getSelectedRecords?.() || (recs[bestIdx] ? [recs[bestIdx]] : []);
          for (const multi of multis) {
            try {
              const fields = multi.fields || {};
              const valueField = fields.value || 'value';
              const textField = fields.text || 'text';
              const ds = Array.isArray(multi.dataSource) ? multi.dataSource : multi.dataSource?.result || [];
              let values = selected
                .map((r) => r?.[valueField] ?? r?.[textField] ?? r?.InmateId ?? r?.inmateId ?? r?.Id ?? r?.id)
                .filter((v) => v != null && v !== '');
              if (!values.length && ds.length) {
                const match = ds.find((d) => score(d) > 0);
                if (match) values = [match[valueField] ?? match[textField] ?? match];
              }
              if (values.length) {
                // Exactly one recipient — never stack prior To chips.
                multi.value = [values[0]];
                multi.dataBind?.();
                multi.updateValue?.();
                multi.hidePopup?.();
              }
            } catch (_) {}
          }

          return { ok: true, method: 'grid-api', selected: label || String(bestIdx), score: bestScore };
        } catch (_) {}
      }

      for (const multi of multis) {
        try {
          const ds = Array.isArray(multi.dataSource) ? multi.dataSource : multi.dataSource?.result || multi.listData || [];
          if (!Array.isArray(ds) || !ds.length) continue;
          let best = null;
          let bestScore = 0;
          for (const item of ds) {
            const sc = score(item);
            if (sc > bestScore) {
              bestScore = sc;
              best = item;
            }
          }
          if (!best || bestScore <= 0) continue;
          const fields = multi.fields || {};
          const valueField = fields.value || 'value';
          const value = best[valueField] ?? best.InmateId ?? best.inmateId ?? best.Id ?? best.id ?? best;
          multi.value = [value];
          multi.dataBind?.();
          multi.hidePopup?.();
          const textField = fields.text || 'text';
          const selectedName =
            best[textField] ||
            best.name ||
            best.Name ||
            best.DisplayName ||
            best.label ||
            best.Text ||
            (typeof best === 'string' ? best : '') ||
            String(value);
          return { ok: true, method: 'multiselect-api', selected: String(selectedName).trim(), score: bestScore };
        } catch (_) {}
      }

      return { ok: false, reason: 'api-miss', gridCount: grids.length, multiCount: multis.length };
    })()`,
    true
  );
}

/**
 * Clear all recipients from the CorrLinks compose To multiselect.
 * Prevents stacking previous inmates onto the next compose.
 */
async function clearComposeToField(win) {
  return win.webContents.executeJavaScript(
    `(() => {
      const multis = [];
      const seen = new Set();
      const push = (inst) => {
        if (!inst || seen.has(inst)) return;
        seen.add(inst);
        multis.push(inst);
      };
      try {
        if (window.ej?.base?.getInstance) {
          document.querySelectorAll('.e-multiselect, .e-multi-select-wrapper, input.e-dropdownbase').forEach((el) => {
            try { push(window.ej.base.getInstance(el, 'multiselect') || window.ej.base.getInstance(el)); } catch (_) {}
          });
        }
      } catch (_) {}
      for (const multi of multis) {
        try {
          multi.value = [];
          multi.text = '';
          multi.dataBind?.();
          multi.updateValue?.();
          multi.clearAll?.();
          multi.clear?.();
        } catch (_) {}
      }
      document.querySelectorAll(
        '.e-multiselect .e-chips-close, .e-multi-select-wrapper .e-chips-close, .e-chip-delete, .e-chips .e-chips-close'
      ).forEach((btn) => {
        try { btn.click(); } catch (_) {}
      });
      return { ok: true, cleared: multis.length };
    })()`,
    true
  );
}

/**
 * Select inmate in CorrLinks compose "* To" picker.
 * Retries until To chip/value sticks (inmate id present), not just a transient checkbox flash.
 */
async function selectComposeRecipient(win, { recipientName, inmateId } = {}) {
  if (!recipientName && !inmateId) {
    return { ok: false, reason: 'No recipient name/inmateId provided' };
  }

  const filterTokens = recipientFilterTokens(recipientName, inmateId);
  const attempts = [];

  setStatus({
    state: 'compose',
    message: `Selecting To recipient: ${recipientName || inmateId}`,
  });

  // Wait for To control (poll fast).
  const waitStart = Date.now();
  while (Date.now() - waitStart < 12000) {
    const ready = await win.webContents.executeJavaScript(
      `!!(document.querySelector('.e-multiselect, .e-multi-select-wrapper'))`,
      true
    );
    if (ready) break;
    await new Promise((r) => setTimeout(r, 30));
  }

  win.focus();
  // Always start from an empty To field so prior recipients never stack.
  await clearComposeToField(win);
  await new Promise((r) => setTimeout(r, 15));

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const filterText = filterTokens[(attempt - 1) % filterTokens.length] || filterTokens[0] || '';
    setStatus({
      state: 'compose',
      message: `To select attempt ${attempt}/5 (filter: ${filterText})`,
    });

    const opened = await openToPickerAndFilter(win, filterText);
    if (!opened?.ok) {
      attempts.push({ attempt, opened });
      continue;
    }
    await new Promise((r) => setTimeout(r, 60));

    // Strategy A: Syncfusion APIs
    const api = await trySyncfusionSelectRecipient(win, { recipientName, inmateId });
    let verified = await verifyToRecipientSelected(win, { recipientName, inmateId });
    if (verified?.ok) {
      return {
        ok: true,
        selected: api?.selected || verified.chips?.[0] || inmateId || recipientName,
        method: api?.method || 'api',
        verified,
        attempts: attempt,
      };
    }

    // Strategy B: CDP trusted clicks on checkbox then name cell (fresh coords each click).
    const target = await locateRecipientClickTarget(win, { recipientName, inmateId });
    if (target?.ok) {
      for (const point of target.points || []) {
        try {
          await cdpClick(win, point.x, point.y);
        } catch (_) {
          clickAt(win, point.x, point.y);
        }
        await new Promise((r) => setTimeout(r, 25));
        verified = await verifyToRecipientSelected(win, { recipientName, inmateId });
        if (verified?.ok) {
          return {
            ok: true,
            selected: target.selected,
            method: `cdp-${point.kind}`,
            verified,
            attempts: attempt,
          };
        }
      }

      // Re-measure checkbox and click again (layout can shift after first click).
      const again = await locateRecipientClickTarget(win, { recipientName, inmateId });
      if (again?.ok && again.points?.[0]) {
        try {
          await cdpClick(win, again.points[0].x, again.points[0].y);
        } catch (_) {
          clickAt(win, again.points[0].x, again.points[0].y);
        }
        await new Promise((r) => setTimeout(r, 25));
      }
    }

    // Commit keys / confirm buttons.
    win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Space' });
    win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Space' });
    await new Promise((r) => setTimeout(r, 15));
    win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Return' });
    win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Return' });
    await new Promise((r) => setTimeout(r, 25));

    await win.webContents.executeJavaScript(
      `(() => {
        const btn = [...document.querySelectorAll('button, .e-btn')].find((b) =>
          /^(ok|select|apply|add|done)$/i.test((b.innerText || '').trim())
        );
        btn?.click();
        return !!btn;
      })()`,
      true
    );
    await new Promise((r) => setTimeout(r, 30));

    // Click outside To control to commit chips.
    clickAt(win, 40, 40);
    await new Promise((r) => setTimeout(r, 25));

    verified = await verifyToRecipientSelected(win, { recipientName, inmateId });
    attempts.push({
      attempt,
      filterText,
      api,
      target: target?.ok ? { selected: target.selected, score: target.score } : target,
      verified,
    });

    if (verified?.ok) {
      return {
        ok: true,
        selected: target?.selected || api?.selected || verified.chips?.[0] || inmateId,
        method: 'retry-commit',
        verified,
        attempts: attempt,
      };
    }
  }

  const last = attempts[attempts.length - 1];
  return {
    ok: false,
    reason: 'Matched recipient but To selection did not stick after retries',
    detail: last,
    attempts: attempts.length,
  };
}

/**
 * Fill CorrLinks compose Subject field (Syncfusion/Angular-friendly).
 */
async function fillComposeSubject(win, subject) {
  if (!subject) return { ok: false, reason: 'Empty subject' };

  setStatus({ state: 'compose', message: `Filling subject: ${subject}` });

  const result = await win.webContents.executeJavaScript(
    `(() => {
      const subjectValue = ${JSON.stringify(subject)};
      const candidates = [
        ...document.querySelectorAll('input, textarea'),
      ];
      let el = null;
      for (const input of candidates) {
        const labelish = [
          input.getAttribute('aria-label') || '',
          input.getAttribute('placeholder') || '',
          input.getAttribute('name') || '',
          input.id || '',
          input.closest('div')?.innerText?.slice(0, 40) || '',
        ].join(' ').toLowerCase();
        if (/subject/.test(labelish) && input.type !== 'password' && input.type !== 'checkbox') {
          el = input;
          break;
        }
      }
      if (!el) {
        // Fallback: labeled "Subject" nearby
        const labels = [...document.querySelectorAll('label, span, div')];
        const lab = labels.find((n) => /^\\s*subject\\s*$/i.test((n.innerText || '').trim()));
        if (lab) {
          el = lab.parentElement?.querySelector('input, textarea') ||
            document.querySelector('input[id*="subject" i], input[name*="subject" i]');
        }
      }
      if (!el) return { ok: false, reason: 'Could not find Subject field' };

      const inst = el.ej2_instances && el.ej2_instances[0];
      if (inst) {
        inst.value = subjectValue;
        inst.dataBind?.();
        try {
          inst.trigger?.('input', { value: subjectValue });
          inst.trigger?.('change', { value: subjectValue });
        } catch (_) {}
      }

      el.focus();
      try {
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, subjectValue);
      } catch (_) {}

      const proto = el.tagName === 'TEXTAREA'
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) setter.call(el, subjectValue);
      else el.value = subjectValue;

      el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: subjectValue, inputType: 'insertText' }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.blur();

      return { ok: true, value: el.value, viaEj2: !!inst };
    })()`,
    true
  );

  return result;
}

/** Inspect compose page readiness for Send (To settled, Send enabled). */
async function readComposeSendReady(win) {
  try {
    return await win.webContents.executeJavaScript(
      `(() => {
        try {
          function isSendButton(el) {
            const text = String(el.innerText || el.value || el.getAttribute('aria-label') || '')
              .replace(/\\s+/g, ' ')
              .trim()
              .toLowerCase();
            return text === 'send' || text === 'send message' || /^send\\b/.test(text);
          }
          function isVisible(el) {
            if (!el) return false;
            const r = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            return r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0';
          }
          // Only count VISIBLE To/multiselect spinners — Syncfusion leaves hidden panes in the DOM.
          const spinnerNodes = [...document.querySelectorAll(
            '.e-multiselect .e-spinner-pane, .e-dropdownbase .e-spinner-pane, .e-spinner-pane, .e-spin-show'
          )];
          const spinning = spinnerNodes.some((el) => {
            if (el.classList.contains('e-spin-hide')) return false;
            return isVisible(el);
          });
          const chips = [...document.querySelectorAll(
            '.e-multiselect .e-chip-content, .e-multi-select-wrapper .e-chip-content, .e-chip .e-chip-content, .e-chips .e-chip-content'
          )]
            .map((el) => (el.textContent || '').trim())
            .filter((t) => t && !/^\\+\\d+$/.test(t));
          let toInput = null;
          try {
            toInput = document.querySelector(
              '.e-multiselect input, .e-multi-select-wrapper input, #to input, [formcontrolname="to"] input'
            );
          } catch (_) {}
          const toHasValue = Boolean(
            chips.length ||
            (toInput && String(toInput.value || '').trim()) ||
            document.querySelector('.e-multiselect .e-chip, .e-chips-close, .e-chip-item')
          );
          const nodes = [...document.querySelectorAll('button, input[type="submit"], a.e-btn, .e-btn, [role="button"]')];
          const candidates = nodes
            .filter((el) => isSendButton(el) && isVisible(el))
            .map((el) => {
              const r = el.getBoundingClientRect();
              const disabled =
                Boolean(el.disabled) ||
                el.getAttribute('disabled') != null ||
                el.getAttribute('aria-disabled') === 'true' ||
                el.classList.contains('e-disabled');
              return {
                text: String(el.innerText || el.value || 'Send').trim(),
                disabled,
                x: r.left + r.width / 2,
                y: r.top + r.height / 2,
                w: r.width,
                h: r.height,
                className: String(el.className || ''),
              };
            });
          const enabled = candidates.find((c) => !c.disabled) || null;
          return {
            spinning,
            chipCount: chips.length,
            toHasValue,
            chips: chips.slice(0, 3),
            candidateCount: candidates.length,
            send: enabled,
            url: location.href,
          };
        } catch (err) {
          return {
            spinning: false,
            chipCount: 0,
            toHasValue: false,
            chips: [],
            candidateCount: 0,
            send: null,
            url: location.href,
            scriptError: String(err && err.message || err),
          };
        }
      })()`,
      true
    );
  } catch (error) {
    return {
      spinning: false,
      chipCount: 0,
      toHasValue: false,
      chips: [],
      candidateCount: 0,
      send: null,
      scriptError: error.message || String(error),
    };
  }
}

/**
 * Wait until To settles and an enabled Send button is available.
 * Phantom Syncfusion spinners must not block forever — if To+Send look ready, proceed.
 */
async function waitForComposeSendReady(win, timeoutMs = 8000) {
  const started = Date.now();
  let last = null;
  let readySince = 0;
  while (Date.now() - started < timeoutMs) {
    last = await readComposeSendReady(win);
    const toReady = Boolean(last?.chipCount > 0 || last?.toHasValue);
    const elapsed = Date.now() - started;
    const sendReady = Boolean(last?.send);
    const looksReady = sendReady && (toReady || elapsed > 400);

    if (looksReady && !last.spinning) {
      return { ok: true, ...last };
    }

    // To already selected + Send enabled, but a sticky/phantom spinner remains:
    // brief settle then send anyway.
    if (looksReady && last.spinning) {
      if (!readySince) readySince = Date.now();
      if (Date.now() - readySince >= 80) {
        return { ok: true, ignoredSpinner: true, ...last };
      }
    } else {
      readySince = 0;
    }

    await new Promise((r) => setTimeout(r, 25));
  }

  // Last chance: Send enabled and To present — click even if spinner flag stuck.
  if (last?.send && (last.chipCount > 0 || last.toHasValue)) {
    return { ok: true, forced: true, ...last };
  }

  return {
    ok: false,
    reason: last?.scriptError
      ? `Send ready script error: ${last.scriptError}`
      : last?.spinning
        ? 'To field still loading (spinner)'
        : !(last?.chipCount || last?.toHasValue)
          ? 'No To recipient before Send'
          : last?.candidateCount
            ? 'Send button still disabled'
            : 'Send button not found',
    ...last,
  };
}

/**
 * Click the CorrLinks compose Send button with a trusted CDP click (Syncfusion-safe).
 * Success = ONLY a visible “Message successfully sent” dialog (then OK).
 * Never treat navigation alone as success — that was skipping part 1.
 */
async function clickComposeSend(win, { expectedFingerprint = '', expectedBodyLength = 0 } = {}) {
  try {
    setStatus({
      state: 'sending',
      message: 'Waiting for Send to become ready…',
    });

    // Quick peek only — do not burn seconds waiting for a dialog that is not there.
    await dismissSendSuccessDialog(win, { waitMs: 0 }).catch(() => {});

    // Body must already be on the page before we trust Send.
    if (expectedBodyLength > 0) {
      const bodyCheck = await readComposeBodyState(win);
      if ((bodyCheck?.length || 0) < Math.floor(expectedBodyLength * 0.9)) {
        return {
          ok: false,
          reason: `Refusing Send — body too short (${bodyCheck?.length || 0}/${expectedBodyLength})`,
          bodyLength: bodyCheck?.length || 0,
          bodyHead: bodyCheck?.head || '',
        };
      }
    }

    const ready = await waitForComposeSendReady(win, 8000);
    if (!ready.ok || !ready.send) {
      return { ok: false, reason: ready.reason || 'Send not ready' };
    }

    const beforeBody = await readComposeBodyState(win);
    if (expectedBodyLength > 0 && (beforeBody?.length || 0) < Math.floor(expectedBodyLength * 0.9)) {
      return {
        ok: false,
        reason: `Refusing Send — body disappeared (${beforeBody?.length || 0}/${expectedBodyLength})`,
        bodyLength: beforeBody?.length || 0,
        bodyHead: beforeBody?.head || '',
      };
    }

    setStatus({
      state: 'sending',
      message:
        `Clicking Send (${ready.send.text})…` +
        ` · ${beforeBody?.length || 0} chars` +
        (beforeBody?.head ? ` · “${String(beforeBody.head).slice(0, 40)}…”` : '') +
        (expectedFingerprint ? ` · expect “${expectedFingerprint.slice(0, 40)}”` : ''),
    });

    // Extra settle once Send is enabled — Angular needs a moment after large paste.
    await new Promise((r) => setTimeout(r, 500));

    win.focus();
    clickAt(win, ready.send.x, ready.send.y);
    await cdpClick(win, ready.send.x, ready.send.y).catch(() => {});
    await win.webContents.executeJavaScript(
      `(() => {
        const nodes = [...document.querySelectorAll('button, input[type="submit"], a.e-btn, .e-btn')];
        const send = nodes.find((el) => {
          const text = String(el.innerText || el.value || '').replace(/\\s+/g, ' ').trim().toLowerCase();
          const disabled =
            Boolean(el.disabled) ||
            el.getAttribute('disabled') != null ||
            el.getAttribute('aria-disabled') === 'true';
          return !disabled && (text === 'send' || text === 'send message' || /^send\\b/.test(text));
        });
        if (!send) return false;
        try { send.focus(); } catch (_) {}
        send.click();
        return true;
      })()`,
      true
    ).catch(() => false);

    // Give CorrLinks a beat to process before polling for the success dialog.
    await new Promise((r) => setTimeout(r, 350));
    setStatus({
      state: 'sending',
      message: 'Waiting for “Message successfully sent”…',
    });
    let successDlg = await dismissSendSuccessDialog(win, { waitMs: 10000 });
    if (successDlg.success) {
      setStatus({
        state: 'sending',
        message: `Send confirmed (OK) · ${beforeBody?.length || 0} chars` +
          (beforeBody?.head ? ` · “${String(beforeBody.head).slice(0, 48)}”` : ''),
      });
      return {
        ok: true,
        text: ready.send.text,
        via: 'success-dialog',
        url: win.webContents.getURL(),
        successDialog: successDlg,
        bodyLength: beforeBody?.length || 0,
        bodyHead: beforeBody?.head || '',
      };
    }

    await dismissValidationDialog(win).catch(() => {});
    let url = win.webContents.getURL();
    let stillOnCompose = /mailbox\/compose/i.test(String(url || ''));

    // One retry only — still require the real success dialog afterward.
    if (stillOnCompose) {
      const again = await readComposeSendReady(win);
      if (again?.send) {
        setStatus({
          state: 'sending',
          message: 'No success dialog yet — retrying Send click…',
        });
        clickAt(win, again.send.x, again.send.y);
        await cdpClick(win, again.send.x, again.send.y).catch(() => {});
        await new Promise((r) => setTimeout(r, 350));
        successDlg = await dismissSendSuccessDialog(win, { waitMs: 10000 });
        if (successDlg.success) {
          return {
            ok: true,
            text: ready.send.text,
            via: 'success-dialog-retry',
            url: win.webContents.getURL(),
            successDialog: successDlg,
            bodyLength: beforeBody?.length || 0,
            bodyHead: beforeBody?.head || '',
          };
        }
        url = win.webContents.getURL();
        stillOnCompose = /mailbox\/compose/i.test(String(url || ''));
      }
    }

    return {
      ok: false,
      reason: 'Send click did not show “Message successfully sent” dialog',
      text: ready.send.text,
      url,
      stillOnCompose,
      bodyLength: beforeBody?.length || 0,
      bodyHead: beforeBody?.head || '',
    };
  } catch (error) {
    return {
      ok: false,
      reason: error.message || String(error),
    };
  }
}

/**
 * Paste message body into CorrLinks compose (no Send).
 */
async function fillComposeBody(win, bodyText) {
  if (bodyText == null || bodyText === '') {
    return { ok: false, reason: 'Empty body text' };
  }

  setStatus({
    state: 'compose',
    message: `Pasting message body (${String(bodyText).length} chars)…`,
  });

  const result = await win.webContents.executeJavaScript(
    `(() => {
      const bodyValue = ${JSON.stringify(String(bodyText))};

      function setNative(el, value) {
        const inst = el.ej2_instances && el.ej2_instances[0];
        if (inst) {
          inst.value = value;
          inst.dataBind?.();
          try {
            inst.trigger?.('input', { value });
            inst.trigger?.('change', { value });
          } catch (_) {}
        }
        el.focus();
        try {
          document.execCommand('selectAll', false, null);
          document.execCommand('insertText', false, value);
        } catch (_) {}
        const proto = el.tagName === 'TEXTAREA'
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (setter) setter.call(el, value);
        else el.value = value;
        el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: value, inputType: 'insertText' }));
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return (el.value || '').length;
      }

      // Prefer labeled Message / Body textarea
      const inputs = [...document.querySelectorAll('textarea, input:not([type="hidden"]):not([type="checkbox"]):not([type="password"]), [contenteditable="true"]')];
      let el = null;
      for (const input of inputs) {
        const hint = [
          input.getAttribute('aria-label') || '',
          input.getAttribute('placeholder') || '',
          input.getAttribute('name') || '',
          input.id || '',
          input.className || '',
          input.closest('div')?.innerText?.slice(0, 60) || '',
        ].join(' ').toLowerCase();
        if (/message|body|content|compose/.test(hint) && !/subject|password|email|to\\b/.test(hint)) {
          el = input;
          break;
        }
      }

      if (!el) {
        el = document.querySelector('textarea') ||
          document.querySelector('.e-richtexteditor [contenteditable="true"]') ||
          document.querySelector('[contenteditable="true"]');
      }
      if (!el) return { ok: false, reason: 'Could not find message body field' };

      if (el.getAttribute && el.getAttribute('contenteditable') === 'true') {
        el.focus();
        try {
          document.execCommand('selectAll', false, null);
          document.execCommand('insertText', false, bodyValue);
        } catch (_) {
          el.innerText = bodyValue;
        }
        el.dispatchEvent(new InputEvent('input', { bubbles: true, data: bodyValue, inputType: 'insertText' }));
        return { ok: true, length: (el.innerText || '').length, via: 'contenteditable' };
      }

      const length = setNative(el, bodyValue);
      // Large pastes: if insertText truncated, force value again
      if (length < bodyValue.length * 0.9) {
        const proto = el.tagName === 'TEXTAREA'
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (setter) setter.call(el, bodyValue);
        else el.value = bodyValue;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }

      return {
        ok: true,
        length: (el.value || '').length,
        expected: bodyValue.length,
        via: el.tagName.toLowerCase(),
      };
    })()`,
    true
  );

  return result;
}

function isCorrlinksLoginUrl(url) {
  return /\/login(?:[/?#]|$)/i.test(String(url || ''));
}

async function goToCompose(win, {
  recipientName,
  inmateId,
  subject,
  exchangeParts = [],
  exchangeSkipped = [],
  send = false,
  skipNavigate = false,
} = {}) {
  const composedSubject = subject || buildCorrlinksSubject();
  const parts = Array.isArray(exchangeParts) ? exchangeParts : [];
  const currentPart = parts[0] || null;
  const pendingParts = parts.slice(1);

  setStatus({
    state: 'compose',
    message: skipNavigate ? 'Filling next compose…' : 'Opening mailbox compose…',
    url: CORRLINKS.composeUrl,
    subject: composedSubject,
  });
  if (!skipNavigate) {
    try {
      await win.loadURL(CORRLINKS.composeUrl);
    } catch (error) {
      const msg = String(error?.message || error);
      if (!/ERR_ABORTED|-3/.test(msg)) {
        throw error;
      }
    }
    // First compose after login needs a short settle for Syncfusion To/body controls.
    await new Promise((r) => setTimeout(r, 200));
  } else {
    await new Promise((r) => setTimeout(r, 80));
  }

  const landedUrl = win.webContents.getURL();
  if (isCorrlinksLoginUrl(landedUrl)) {
    return {
      url: landedUrl,
      recipient: { ok: false, reason: 'Session lost — landed on CorrLinks login (not logged in)' },
      subject: composedSubject,
      subjectResult: { ok: false, reason: 'Not on compose page' },
      bodyResult: { ok: false, reason: 'Not on compose page' },
      pastedPart: null,
      pendingParts: pendingParts.map((p) => ({
        part: p.part,
        filename: p.filename,
        url: p.url,
        characters: p.characters || p.text?.length || 0,
      })),
      exchangeSkipped,
      sessionLost: true,
    };
  }

  // Compose page can also show lock validation dialogs.
  await dismissValidationDialog(win);

  let recipient = null;
  if (recipientName || inmateId) {
    recipient = await selectComposeRecipient(win, { recipientName, inmateId });
    if (!recipient.ok) {
      setStatus({
        state: 'compose',
        message: `Compose opened but To select failed: ${recipient.reason || 'unknown'}`,
        recipient,
        subject: composedSubject,
      });
    } else {
      setStatus({
        state: 'compose',
        message: `Compose To selected: ${recipient.selected}`,
        recipient,
        subject: composedSubject,
      });
    }
  }

  const subjectResult = await fillComposeSubject(win, composedSubject);
  if (!subjectResult?.ok) {
    setStatus({
      state: 'compose',
      message: `Subject fill failed (${composedSubject}): ${subjectResult?.reason || 'unknown'}`,
      subject: composedSubject,
      subjectResult,
      recipient,
    });
  } else {
    setStatus({
      state: 'compose',
      message: `Subject set: ${composedSubject}`,
      subject: composedSubject,
      subjectResult,
      recipient,
    });
  }

  let bodyResult = null;
  if (exchangeSkipped?.length) {
    setStatus({
      state: 'compose',
      message: `Skipped empty file(s): ${exchangeSkipped.map((f) => f.filename).join(', ')}`,
      exchangeSkipped,
    });
  }

  if (!currentPart) {
    bodyResult = {
      ok: false,
      skipped: true,
      reason: parts.length === 0 && exchangeSkipped?.length
        ? 'All exchange files were empty — nothing to paste'
        : 'No exchange file parts to paste',
    };
    setStatus({
      state: 'compose',
      message: bodyResult.reason,
      bodyResult,
    });
  } else {
    // Part 2+ (and later): put CONT.. on the first line so the inmate sees continuation.
    const rawBody = currentPart.text || '';
    const isContinuation =
      Boolean(currentPart.continuation) || Number(currentPart.part) > 1;
    const bodyText =
      isContinuation && !/^\s*CONT\.\./i.test(rawBody)
        ? `CONT..\n\n${rawBody}`
        : rawBody;
    bodyResult = await fillComposeBody(win, bodyText);
    if (bodyResult?.ok) {
      // Critical: wait until the textarea actually holds this file before Send.
      const bodyReady = await waitForComposeBodyReady(win, bodyText, 6000);
      if (!bodyReady.ok) {
        bodyResult = {
          ...bodyResult,
          ok: false,
          reason: bodyReady.reason || 'Body paste did not stick',
          bodyReady,
        };
      } else {
        bodyResult = { ...bodyResult, length: bodyReady.length, bodyReady };
      }
    }
    bodyResult = {
      ...bodyResult,
      filename: currentPart.filename,
      part: currentPart.part,
      url: currentPart.url,
      pendingCount: pendingParts.length,
      send: Boolean(send),
      continuation: isContinuation,
      pastedTextLength: bodyText.length,
    };
    setStatus({
      state: 'compose',
      message: bodyResult.ok
        ? `Pasted part ${currentPart.part}/${parts.length}: ${currentPart.filename} (${bodyText.length} chars)` +
          (send
            ? ' · sending…'
            : pendingParts.length
              ? ` · ${pendingParts.length} more part(s) pending (no send yet)`
              : ' · no send yet')
        : `Body paste failed: ${bodyResult.reason || 'unknown'}`,
      bodyResult,
      pendingParts: pendingParts.map((p) => ({
        part: p.part,
        filename: p.filename,
        characters: p.characters || p.text?.length || 0,
      })),
    });
  }

  let sendResult = null;
  if (send && bodyResult?.ok) {
    // Confirm To is still selected, then pause so Syncfusion binds body before Send.
    await new Promise((r) => setTimeout(r, 300));
    if (recipientName || inmateId) {
      const stillTo = await verifyToRecipientSelected(win, { recipientName, inmateId }).catch(() => null);
      if (!stillTo?.ok) {
        setStatus({
          state: 'compose',
          message: 'Re-selecting To before Send…',
          recipient,
        });
        recipient = await selectComposeRecipient(win, { recipientName, inmateId });
        await new Promise((r) => setTimeout(r, 250));
      } else {
        setStatus({
          state: 'sending',
          message: `To confirmed (${stillTo.selected || recipientName}) — settling before Send…`,
          recipient: stillTo,
        });
      }
    }
    const expectedLen = Number(bodyResult.pastedTextLength || currentPart.text?.length || 0);
    setStatus({
      state: 'sending',
      message: `Waiting 1.2s before Send · part ${currentPart.part}: ${currentPart.filename}…`,
      bodyResult,
      recipient,
      subject: composedSubject,
    });
    // Little delay before Send — prevents part 1 firing before CorrLinks accepts the body.
    await new Promise((r) => setTimeout(r, 1200));
    setStatus({
      state: 'sending',
      message: `Sending part ${currentPart.part}: ${currentPart.filename} (${expectedLen} chars)…`,
      bodyResult,
      recipient,
      subject: composedSubject,
    });
    sendResult = await clickComposeSend(win, {
      expectedFingerprint: bodyFingerprint(
        bodyResult.continuation && currentPart.text
          ? `CONT..\n\n${currentPart.text}`
          : currentPart.text || ''
      ),
      expectedBodyLength: expectedLen,
    });
    bodyResult = {
      ...bodyResult,
      sendResult,
      sent: Boolean(sendResult?.ok),
    };
    setStatus({
      state: sendResult?.ok ? 'sending' : 'error',
      message: sendResult?.ok
        ? `Sent part ${currentPart.part}/${parts.length}: ${currentPart.filename}`
        : `Send failed for ${currentPart.filename}: ${sendResult?.reason || 'unknown'}`,
      bodyResult,
      sendResult,
      recipient,
      subject: composedSubject,
    });
  } else if (send && bodyResult && !bodyResult.ok) {
    setStatus({
      state: 'error',
      message: `Cannot send — body paste failed: ${bodyResult.reason || 'unknown'}`,
      bodyResult,
    });
  }

  const url = win.webContents.getURL();
  return {
    url,
    recipient,
    subject: composedSubject,
    subjectResult,
    bodyResult,
    sendResult,
    pastedPart: currentPart
      ? { part: currentPart.part, filename: currentPart.filename, characters: currentPart.text?.length || 0 }
      : null,
    pendingParts: pendingParts.map((p) => ({
      part: p.part,
      filename: p.filename,
      url: p.url,
      characters: p.characters || p.text?.length || 0,
    })),
    exchangeSkipped,
  };
}

/**
 * After a send, stay logged in and open a fresh compose for the next file.
 * Always navigate to compose URL for a clean form (avoids leftover part-1 body).
 */
async function prepareNextCompose(win) {
  await dismissSendSuccessDialog(win, { waitMs: 0 }).catch(() => {});
  await dismissValidationDialog(win).catch(() => {});

  const urlNow = win.webContents.getURL();
  if (isCorrlinksLoginUrl(urlNow)) {
    return { ok: false, sessionLost: true, url: urlNow };
  }

  setStatus({
    state: 'compose',
    message: 'Still logged in — opening fresh compose for next file…',
    url: urlNow,
  });

  try {
    await win.loadURL(CORRLINKS.composeUrl);
  } catch (error) {
    const msg = String(error?.message || error);
    if (!/ERR_ABORTED|-3/.test(msg)) throw error;
  }

  await new Promise((r) => setTimeout(r, 60));
  await dismissSendSuccessDialog(win, { waitMs: 0 }).catch(() => {});
  await dismissValidationDialog(win).catch(() => {});

  const landed = win.webContents.getURL();
  if (isCorrlinksLoginUrl(landed)) {
    return { ok: false, sessionLost: true, url: landed };
  }
  return { ok: true, url: landed, via: 'compose-url' };
}

/**
 * Compose each exchange file as its own CorrLinks message.
 * When send=true (single inmate only): automatically Send part 1, then 2, then 3…
 * When send=false: keep legacy paste-first-part-only behavior for the loop.
 */
async function composeAllParts(win, {
  recipientName,
  inmateId,
  subject,
  exchangeParts = [],
  exchangeSkipped = [],
  send = false,
} = {}) {
  const parts = Array.isArray(exchangeParts) ? exchangeParts : [];
  if (!send) {
    return goToCompose(win, {
      recipientName,
      inmateId,
      subject,
      exchangeParts: parts,
      exchangeSkipped,
      send: false,
    });
  }

  if (!parts.length) {
    return goToCompose(win, {
      recipientName,
      inmateId,
      subject,
      exchangeParts: [],
      exchangeSkipped,
      send: false,
    });
  }

  const sentParts = [];
  const failedParts = [];
  let lastCompose = null;

  setStatus({
    state: 'sending',
    message: `Auto-sending ${parts.length} file(s) for ${recipientName || inmateId || 'inmate'}…`,
    recipientName,
    inmateId,
  });

  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    const fingerprint = bodyFingerprint(part.text || '');
    setStatus({
      state: 'compose',
      message: `Auto-send ${i + 1}/${parts.length}: ${part.filename || 'file'}…` +
        (fingerprint ? ` (“${fingerprint.slice(0, 40)}”)` : ''),
      recipientName,
      inmateId,
      sendProgress: { current: i + 1, total: parts.length },
    });

    // Stay logged in — open next compose in the same session (no logout).
    if (i > 0) {
      const next = await prepareNextCompose(win);
      if (next?.sessionLost) {
        failedParts.push({
          part: part.part,
          filename: part.filename,
          reason: 'Session lost after previous send — landed on login',
        });
        break;
      }
    }

    const compose = await goToCompose(win, {
      recipientName,
      inmateId,
      subject,
      exchangeParts: [{ ...part, continuation: i > 0 }],
      exchangeSkipped: i === 0 ? exchangeSkipped : [],
      send: true,
      // Always navigate for part 1; part 2+ already opened a fresh compose URL.
      skipNavigate: i > 0,
    });
    lastCompose = compose;

    if (compose.sessionLost) {
      failedParts.push({
        part: part.part,
        filename: part.filename,
        reason: compose.recipient?.reason || 'Session lost',
      });
      break;
    }

    // Only count real CorrLinks success dialog — never navigation-only “success”.
    const sentOk = Boolean(
      compose.bodyResult?.ok &&
      compose.sendResult?.ok &&
      /success-dialog/i.test(String(compose.sendResult?.via || ''))
    );
    if (sentOk) {
      sentParts.push({
        part: part.part,
        filename: part.filename,
        characters: compose.sendResult?.bodyLength || part.characters || part.text?.length || 0,
        subject: compose.subject || subject,
        bodyHead: compose.sendResult?.bodyHead || fingerprint,
        via: compose.sendResult?.via,
      });
      setStatus({
        state: 'sending',
        message: `Sent ${i + 1}/${parts.length}: ${part.filename || 'file'}` +
          (i < parts.length - 1 ? ' · continuing to next file…' : ' · done'),
        sentParts,
        sendProgress: { current: i + 1, total: parts.length },
      });
    } else {
      failedParts.push({
        part: part.part,
        filename: part.filename,
        reason:
          compose.sendResult?.reason ||
          compose.bodyResult?.reason ||
          compose.recipient?.reason ||
          'Compose/send failed',
      });
      // Stop on first hard failure so the operator can intervene.
      break;
    }

    if (i < parts.length - 1) {
      await new Promise((r) => setTimeout(r, 40));
    }
  }

  return {
    ...(lastCompose || {}),
    sentParts,
    failedParts,
    sendSummary: {
      total: parts.length,
      sent: sentParts.length,
      failed: failedParts.length,
    },
    pendingParts: parts.slice(sentParts.length).map((p) => ({
      part: p.part,
      filename: p.filename,
      url: p.url,
      characters: p.characters || p.text?.length || 0,
    })),
  };
}

async function attemptLogin(win, { email, password, label, clearSession = false }) {
  setStatus({
    state: 'loading',
    message: `Loading CorrLinks login (${label}: ${email})`,
    email,
    attempt: label,
  });

  // Always navigate first so executeJavaScript has a real document.
  // Do NOT clear cookies by default — preserves session for multi-file send.
  await loadLoginPage(win, { clearSession: Boolean(clearSession) });
  await clearAuthToasts(win);
  // Locked-primary → second account: keep dismiss short so fallback stays snappy.
  await dismissValidationDialog(win, {
    waitMs: clearSession ? 80 : 120,
  }).catch(() => {});

  // Same-account session reuse (CorrLinks may redirect to dashboard / interstitial).
  let existing = await detectAlreadyLoggedIn(win);
  if (existing?.already) {
    const existingEmail = (existing.email || '').toLowerCase();
    const targetEmail = String(email || '').toLowerCase();
    // Reuse when: email matches, OR email unknown but already on mailbox/dashboard
    // (avoid clearing session between multi-file sends).
    const canReuse = !existingEmail || existingEmail === targetEmail;
    if (canReuse) {
      const who = existing.email || email;
      setStatus({
        state: 'success',
        message: `Already logged in as ${who} — reusing session`,
        email,
        attempt: label,
        loggedIn: true,
        url: win.webContents.getURL(),
      });
      return {
        state: 'success',
        message: `Already logged in as ${who} — reusing session`,
        email,
        attempt: label,
        loggedIn: true,
        url: win.webContents.getURL(),
      };
    }

    // Different known account → logout then continue to login form.
    setStatus({
      state: 'logout',
      message: `Already logged in as ${existing.email} — switching to ${email}`,
      email,
      attempt: label,
    });
    await forceLogoutExistingSession(win);
  }

  const ready = await waitForLoginForm(win, 90000);
  if (!ready.ok) {
    // One more already-logged-in check (page may have changed during wait).
    const again = await detectAlreadyLoggedIn(win);
    if (again?.already) {
      const existingEmail = (again.email || '').toLowerCase();
      const targetEmail = String(email || '').toLowerCase();
      if (!existingEmail || existingEmail === targetEmail) {
        return {
          state: 'success',
          message: `Already logged in as ${again.email || email} — reusing session`,
          email,
          attempt: label,
          loggedIn: true,
          url: win.webContents.getURL(),
        };
      }
      await forceLogoutExistingSession(win);
      const ready2 = await waitForLoginForm(win, 60000);
      if (!ready2.ok) {
        return {
          state: ready2.pendingManual ? 'manual' : 'error',
          message: ready2.message,
          url: ready2.info?.url || win.webContents.getURL(),
          email,
          attempt: label,
          detail: ready2.info,
        };
      }
    } else {
      return {
        state: ready.pendingManual ? 'manual' : 'error',
        message: ready.message,
        url: ready.info?.url || win.webContents.getURL(),
        email,
        attempt: label,
        detail: ready.info,
      };
    }
  }

  setStatus({
    state: 'filling',
    message: `Filling credentials (${label})`,
    url: win.webContents.getURL(),
    email,
    attempt: label,
  });

  await clearAuthToasts(win);
  await dismissValidationDialog(win).catch(() => {});

  const fillResult = await fillAndSubmit(win, email, password);
  if (!fillResult.ok) {
    return {
      state: 'error',
      message: fillResult.reason || 'Failed to fill login form',
      email,
      attempt: label,
      detail: fillResult,
    };
  }

  setStatus({
    state: 'submitting',
    message: `Submitted login (${label}) — waiting for result`,
    email,
    attempt: label,
  });

  const result = await waitForLoginResult(win);

  if (result.ok) {
    return {
      state: 'success',
      message: result.message,
      url: result.url,
      email,
      attempt: label,
      loggedIn: true,
    };
  }

  if (result.pendingManual) {
    return {
      state: 'manual',
      message: result.message,
      url: result.url,
      email,
      attempt: label,
    };
  }

  if (result.locked) {
    return {
      state: 'locked',
      message: result.message,
      url: result.url,
      email,
      attempt: label,
      locked: true,
      loggedIn: result.loggedIn === true,
      dialogDismissed: result.dialogDismissed === true,
    };
  }

  return {
    state: result.message && classifyAuthMessage(result.message) === 'rejected' ? 'rejected' : 'timeout',
    message: result.message,
    url: result.url,
    email,
    attempt: label,
    locked: false,
  };
}

function summarizeCompose(compose) {
  const toMsg = compose.recipient?.ok
    ? `To=${compose.recipient.selected}`
    : compose.recipient
      ? `To failed (${compose.recipient.reason || 'n/a'})`
      : 'To skipped';
  const subMsg = compose.subjectResult?.ok
    ? `Subject=${compose.subject}`
    : `Subject failed (${compose.subject || 'n/a'})`;
  const bodyMsg = compose.bodyResult?.ok
    ? `Pasted ${compose.pastedPart?.filename || 'body'} (${compose.pastedPart?.characters || 0} chars)`
    : compose.bodyResult?.skipped
      ? compose.bodyResult.reason
      : `Body paste failed (${compose.bodyResult?.reason || 'n/a'})`;
  const sendSummary = compose.sendSummary;
  let pendingMsg = '';
  if (sendSummary) {
    pendingMsg =
      ` · sent ${sendSummary.sent}/${sendSummary.total}` +
      (sendSummary.failed ? ` · ${sendSummary.failed} failed` : '');
  } else if (compose.sendResult?.ok || compose.bodyResult?.sent) {
    pendingMsg = ' · sent';
  } else if (compose.pendingParts?.length) {
    pendingMsg = ` · ${compose.pendingParts.length} more file(s) queued (no send yet)`;
  } else {
    pendingMsg = ' · no send yet';
  }
  return { toMsg, subMsg, bodyMsg, pendingMsg };
}

async function applyComposeToStatus(win, status, composeArgs) {
  const canCompose = status.state === 'success' || (status.state === 'locked' && status.loggedIn);
  if (!canCompose) {
    return setStatus(status);
  }
  try {
    const compose = await composeAllParts(win, composeArgs);
    const { toMsg, subMsg, bodyMsg, pendingMsg } = summarizeCompose(compose);
    const sendFailed = Boolean(compose.sendSummary?.failed);
    const sentAny = Boolean(compose.sendSummary?.sent);
    return setStatus({
      ...status,
      state: sendFailed ? 'error' : status.state === 'success' ? 'success' : status.state,
      message:
        status.state === 'success'
          ? `Logged in — ${toMsg} · ${subMsg} · ${bodyMsg}${pendingMsg}`
          : `${status.message} — ${toMsg} · ${subMsg} · ${bodyMsg}${pendingMsg}`,
      url: compose.url || CORRLINKS.composeUrl,
      recipient: compose.recipient || null,
      subject: compose.subject || null,
      subjectResult: compose.subjectResult || null,
      bodyResult: compose.bodyResult || null,
      sendResult: compose.sendResult || null,
      sentParts: compose.sentParts || [],
      failedParts: compose.failedParts || [],
      sendSummary: compose.sendSummary || null,
      pastedPart: compose.pastedPart || null,
      pendingParts: compose.pendingParts || [],
      exchangeSkipped: compose.exchangeSkipped || [],
      sent: sentAny && !sendFailed,
    });
  } catch (error) {
    return setStatus({
      ...status,
      message: `${status.message || 'Logged in'} — failed to open compose: ${error.message}`,
    });
  }
}

async function downloadExchangeParts(inmate, fetchFileText, { exchangeFiles = null } = {}) {
  const exchange = inmate?.inmate_exchange || {};
  const sendable = Array.isArray(exchangeFiles) && exchangeFiles.length
    ? exchangeFiles
    : Array.isArray(exchange.sendable)
      ? exchange.sendable
      : [];
  const skipped =
    Array.isArray(exchangeFiles) && exchangeFiles.length
      ? []
      : Array.isArray(exchange.skipped)
        ? exchange.skipped
        : [];
  const exchangeParts = [];
  if (typeof fetchFileText === 'function') {
    for (const file of sendable) {
      setStatus({
        state: 'exchange',
        message: `Downloading exchange file part ${file.part}: ${file.filename}`,
      });
      const got = await fetchFileText(file.url);
      exchangeParts.push({
        ...file,
        text: got.text || '',
        characters: got.characters ?? (got.text || '').length,
      });
    }
  }
  return { exchangeParts, exchangeSkipped: skipped };
}

/**
 * Login with primary corrlinks_account first.
 * If CorrLinks reports the account is locked, retry with second_corrlinks_account.
 * Pass skipCompose:true to leave a logged-in session for later composeForInmate calls.
 */
async function loginToCorrlinks({
  email,
  password,
  secondEmail,
  secondPassword,
  recipientName,
  inmateId,
  exchangeParts = [],
  exchangeSkipped = [],
  skipCompose = false,
  subject = null,
  send = false,
} = {}) {
  if (!email || !password) {
    throw new Error('Primary corrlinks email and password are required');
  }

  const win = getOrCreateWindow();
  win.show();
  win.focus();

  setStatus({
    state: 'starting',
    message: `Opening CorrLinks for primary ${email}`,
    email,
    attempt: 'primary',
    recipientName: recipientName || null,
    inmateId: inmateId || null,
    exchangePartCount: Array.isArray(exchangeParts) ? exchangeParts.length : 0,
    skipCompose: Boolean(skipCompose),
    send: Boolean(send),
  });

  async function finishWithCompose(status) {
    if (skipCompose) {
      const canStay =
        status.state === 'success' || (status.state === 'locked' && status.loggedIn);
      return setStatus({
        ...status,
        message: canStay
          ? status.state === 'success'
            ? `Logged in as ${status.email || email} — ready for recipients`
            : `${status.message} — session usable for recipients`
          : status.message,
      });
    }
    return applyComposeToStatus(win, status, {
      recipientName,
      inmateId,
      exchangeParts,
      exchangeSkipped,
      subject,
      send: Boolean(send),
    });
  }

  const primary = await attemptLogin(win, {
    email,
    password,
    label: 'primary',
  });
  setStatus(primary);

  if (primary.state === 'success' || primary.state === 'manual') {
    if (primary.state === 'manual') return getStatus();
    return finishWithCompose(primary);
  }

  if (primary.state === 'locked') {
    if (!secondEmail || !secondPassword) {
      // Single-account probe (no fallback requested) — don't imply "missing second".
      return finishWithCompose({
        ...primary,
        message: primary.loggedIn
          ? primary.message
          : skipCompose
            ? `Account locked (${primary.message})`
            : `Primary account locked (${primary.message}) and no second_corrlinks_account available`,
      });
    }

    setStatus({
      state: 'fallback',
      message: `Primary locked — switching to second account immediately…`,
      email: secondEmail,
      attempt: 'second',
      primaryError: primary.message,
    });

    // Drop lock dialog + session fast, then login as second (no long pauses).
    await dismissValidationDialog(win, { waitMs: 80 }).catch(() => {});
    await clearCorrlinksSession(win);
    const second = await attemptLogin(win, {
      email: secondEmail,
      password: secondPassword,
      label: 'second',
      clearSession: true,
    });

    const finalSecond = {
      ...second,
      primaryError: primary.message,
      usedSecondAccount: true,
    };

    if (finalSecond.state === 'timeout') {
      forceCloseCorrWindow();
      return setStatus({
        ...finalSecond,
        message: `${finalSecond.message} — CorrLinks window force-closed`,
      });
    }

    return finishWithCompose(finalSecond);
  }

  // Only fall back on lock — other primary failures stop here.
  if (primary.state === 'timeout') {
    forceCloseCorrWindow();
    return setStatus({
      ...getStatus(),
      message: `${primary.message} — CorrLinks window force-closed`,
    });
  }

  return getStatus();
}

/**
 * Convenience: accept a normalized inmate row from SportsData.
 * Full path: login (with lock fallback) + compose for that one recipient.
 */
async function loginInmate(
  inmate,
  { fetchFileText, subject = null, exchangeFiles = null, send = false } = {}
) {
  const primary = inmate?.corrlinks_account || {};
  const second = inmate?.second_corrlinks_account || {};
  const { exchangeParts, exchangeSkipped } = await downloadExchangeParts(inmate, fetchFileText, {
    exchangeFiles,
  });

  return loginToCorrlinks({
    email: primary.email,
    password: primary.password,
    secondEmail: second.email,
    secondPassword: second.password,
    recipientName: inmate?.name || null,
    inmateId: inmate?.inmate_id || null,
    exchangeParts,
    exchangeSkipped,
    subject,
    send: Boolean(send),
  });
}

/**
 * Account login only — no compose. Used by the grouped loop before recipients.
 */
async function loginAccount(
  { email, password, secondEmail, secondPassword } = {},
  _options = {}
) {
  // Account-only probes must not inherit another account's lock dialog.
  return loginToCorrlinks({
    email,
    password,
    secondEmail,
    secondPassword,
    skipCompose: true,
  });
}

/** Logout / clear CorrLinks session so the next account probe starts clean. */
async function logoutCorrlinksSession() {
  if (!hostWindow || hostWindow.isDestroyed()) {
    return setStatus({ state: 'idle', message: 'No CorrLinks host window' });
  }
  if (!corrView?.webContents || corrView.webContents.isDestroyed()) {
    return setStatus({ state: 'idle', message: 'No CorrLinks session' });
  }
  const win = getOrCreateWindow();
  await forceLogoutExistingSession(win);
  return setStatus({
    state: 'idle',
    message: 'Logged out of CorrLinks — ready for next account',
    loggedIn: false,
  });
}

/**
 * Compose for one inmate on an already-logged-in CorrLinks session.
 * Does not attempt login.
 */
async function composeForInmate(
  inmate,
  { fetchFileText, subject = null, exchangeFiles = null, send = false } = {}
) {
  if (!inmate) throw new Error('Inmate is required for compose');
  const win = getOrCreateWindow();
  win.show();
  win.focus();

  const { exchangeParts, exchangeSkipped } = await downloadExchangeParts(inmate, fetchFileText, {
    exchangeFiles,
  });
  const recipientName = inmate?.name || null;
  const inmateId = inmate?.inmate_id || null;

  setStatus({
    state: 'compose',
    message: `Composing for ${recipientName || inmateId || inmate.id}…`,
    recipientName,
    inmateId,
    exchangePartCount: exchangeParts.length,
    send: Boolean(send),
  });

  try {
    const compose = await composeAllParts(win, {
      recipientName,
      inmateId,
      exchangeParts,
      exchangeSkipped,
      subject,
      send: Boolean(send),
    });
    if (compose.sessionLost) {
      return setStatus({
        state: 'error',
        message: compose.recipient?.reason || 'Session lost — not logged in',
        url: compose.url || null,
        recipient: compose.recipient || null,
        loggedIn: false,
      });
    }
    const { toMsg, subMsg, bodyMsg, pendingMsg } = summarizeCompose(compose);
    const sendFailed = Boolean(compose.sendSummary?.failed);
    const composeOk =
      Boolean(compose.recipient?.ok) ||
      Boolean(compose.subjectResult?.ok) ||
      Boolean(compose.bodyResult?.ok) ||
      Boolean(compose.sendSummary?.sent);
    return setStatus({
      state: sendFailed ? 'error' : composeOk ? 'success' : 'error',
      message: `${toMsg} · ${subMsg} · ${bodyMsg}${pendingMsg}`,
      url: compose.url || CORRLINKS.composeUrl,
      recipient: compose.recipient || null,
      subject: compose.subject || null,
      subjectResult: compose.subjectResult || null,
      bodyResult: compose.bodyResult || null,
      sendResult: compose.sendResult || null,
      sentParts: compose.sentParts || [],
      failedParts: compose.failedParts || [],
      sendSummary: compose.sendSummary || null,
      pastedPart: compose.pastedPart || null,
      pendingParts: compose.pendingParts || [],
      exchangeSkipped: compose.exchangeSkipped || [],
      loggedIn: true,
      sent: Boolean(compose.sendSummary?.sent) && !sendFailed,
    });
  } catch (error) {
    return setStatus({
      state: 'error',
      message: `Compose failed: ${error.message || String(error)}`,
      recipientName,
      inmateId,
    });
  }
}

module.exports = {
  loginToCorrlinks,
  loginInmate,
  loginAccount,
  composeForInmate,
  logoutCorrlinksSession,
  getStatus,
  getOrCreateWindow,
  forceCloseCorrWindow,
  setHostWindow,
  setCorrBounds,
  selectComposeRecipient,
  clearComposeToField,
  fillComposeSubject,
  fillComposeBody,
  clickComposeSend,
  goToCompose,
  composeAllParts,
  reloadCorrlinksPanel,
  openCorrlinksExternal,
  clearCorrlinksPanelSession,
  zoomCorrlinksPanel,
  hasCorrlinksPanelSession,
};
