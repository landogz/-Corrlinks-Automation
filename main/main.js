const path = require('path');
const fs = require('fs/promises');
const { app, BrowserWindow, ipcMain, dialog, shell, nativeTheme } = require('electron');
const { SportsDataClient } = require('./sportsdataClient');
const {
  loginToCorrlinks,
  loginInmate,
  loginAccount,
  composeForInmate,
  logoutCorrlinksSession,
  getStatus,
  setHostWindow,
  setCorrBounds,
  forceCloseCorrWindow,
  clearAndCloseCorrWindow,
  warmCorrlinksPanel,
  reloadCorrlinksPanel,
  openCorrlinksExternal,
  clearCorrlinksPanelSession,
  zoomCorrlinksPanel,
  hasCorrlinksPanelSession,
} = require('./corrlinksLogin');
const {
  getSportsDataConfig,
  getAppTimezone,
  envPath,
  saveSportsDataCredentials,
  clearSportsDataCredentials,
  reloadSavedCredentials,
} = require('./config');
const {
  fingerprintCorrlinksAccounts,
  loadCorrlinksVerifyCache,
  saveCorrlinksVerifyCache,
  clearCorrlinksVerifyCache,
} = require('./corrlinksVerifyCache');
const {
  buildCorrlinksSubject,
  resolveComposeSubject,
  normalizeWeeklyLeague,
  buildWeeklySubject,
} = require('./subject');
const { applyContinuationPrefix } = require('./exchangeFiles');
const { setupAutoUpdater, registerUpdateIpc } = require('./updater');
const { loadUiPreferences, saveUiPreferences, normalizeTheme } = require('./uiPreferences');

let controlWindow = null;
let uiPreferences = { theme: 'auto' };
let cachedAccounts = [];
const sportsData = new SportsDataClient();
// Force-stop can leave a timer/listener touching a destroyed WebContents. Swallow
// that specific main-process crash so Electron does not show the fatal dialog.
process.on('uncaughtException', (error) => {
  const msg = String(error?.message || error || '');
  if (/object has been destroyed/i.test(msg)) {
    console.warn('[corrlinks] swallowed destroyed-object exception:', msg);
    return;
  }
  console.error('[main] uncaughtException:', error);
});
process.on('unhandledRejection', (reason) => {
  const msg = String(reason?.message || reason || '');
  if (/object has been destroyed/i.test(msg)) {
    console.warn('[corrlinks] swallowed destroyed-object rejection:', msg);
    return;
  }
  console.error('[main] unhandledRejection:', reason);
});

/** Resolve optional daily/weekly template overrides from renderer payload. */
function resolveTemplateOptions(payload = {}, inmate = null) {
  const template = payload.template || {};
  const mode = String(template.mode || payload.mode || 'daily').toLowerCase();
  const league = normalizeWeeklyLeague(template.league || payload.league);
  let files = Array.isArray(template.files)
    ? template.files
    : Array.isArray(payload.exchangeFiles)
      ? payload.exchangeFiles
      : null;
  // Daily mode: honor checked files from the UI when no explicit template.files.
  if ((!files || !files.length) && inmate && Array.isArray(payload.selectedFiles)) {
    const sendable = inmate?.inmate_exchange?.sendable || [];
    const keys = payload.selectedFiles.map(String);
    const filtered = sendable.filter((file, index) => {
      const key = `${file.part}:${file.filename || index}`;
      return keys.includes(key);
    });
    if (filtered.length) files = filtered;
  }
  const subject =
    template.subject ||
    payload.subject ||
    (mode === 'weekly' ? resolveComposeSubject({ mode: 'weekly', league }) : null);
  return {
    mode,
    league,
    subject: subject || null,
    exchangeFiles: files && files.length ? files : null,
  };
}

function createControlWindow() {
  controlWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: 'Inside Scores',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0a0f16' : '#f3f6fa',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    ...(process.platform === 'darwin'
      ? {
          titleBarStyle: 'hiddenInset',
          trafficLightPosition: { x: 14, y: 18 },
        }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  setHostWindow(controlWindow);
  setupAutoUpdater(controlWindow);
  controlWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url).catch(() => {});
    }
    return { action: 'deny' };
  });
  controlWindow.webContents.on('will-navigate', (event, url) => {
    // Keep the shell on the local UI; open outbound http(s) in the browser.
    if (/^https?:\/\//i.test(url)) {
      event.preventDefault();
      shell.openExternal(url).catch(() => {});
    }
  });
  controlWindow.webContents.on('did-finish-load', () => {
    if (process.platform === 'darwin') {
      controlWindow.webContents
        .executeJavaScript('document.body.classList.add("has-traffic-inset")', true)
        .catch(() => {});
    }
  });
  controlWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  const relayout = () => {
    if (!controlWindow || controlWindow.isDestroyed()) return;
    controlWindow.webContents
      .executeJavaScript(
        'typeof window.__syncCorrPaneBounds === "function" && window.__syncCorrPaneBounds()',
        true
      )
      .catch(() => {});
  };
  controlWindow.on('resize', relayout);
  controlWindow.on('maximize', relayout);
  controlWindow.on('unmaximize', relayout);
  controlWindow.on('enter-full-screen', relayout);
  controlWindow.on('leave-full-screen', relayout);
  controlWindow.on('closed', () => {
    forceCloseCorrWindow();
    setHostWindow(null);
    controlWindow = null;
  });
}

function applyWindowChromeTheme() {
  const dark = nativeTheme.shouldUseDarkColors;
  const bg = dark ? '#0a0f16' : '#f3f6fa';
  if (controlWindow && !controlWindow.isDestroyed()) {
    controlWindow.setBackgroundColor(bg);
  }
  return { resolved: dark ? 'dark' : 'light', backgroundColor: bg };
}

function applyThemePreference(pref = 'auto', { persist = true } = {}) {
  const preference = normalizeTheme(pref);
  nativeTheme.themeSource =
    preference === 'light' || preference === 'dark' ? preference : 'system';
  if (persist) {
    uiPreferences = saveUiPreferences({ theme: preference });
  } else {
    uiPreferences = { ...uiPreferences, theme: preference };
  }
  return {
    ok: true,
    preference,
    ...applyWindowChromeTheme(),
  };
}

function registerIpc() {
  ipcMain.on('ui:getThemePreferenceSync', (event) => {
    const preference = normalizeTheme(uiPreferences?.theme || loadUiPreferences().theme);
    nativeTheme.themeSource =
      preference === 'light' || preference === 'dark' ? preference : 'system';
    event.returnValue = {
      preference,
      resolved: nativeTheme.shouldUseDarkColors ? 'dark' : 'light',
    };
  });

  ipcMain.handle('ui:getThemePreference', async () => {
    const preference = normalizeTheme(uiPreferences?.theme || loadUiPreferences().theme);
    return {
      ok: true,
      preference,
      resolved: nativeTheme.shouldUseDarkColors ? 'dark' : 'light',
    };
  });

  ipcMain.handle('ui:setThemePreference', async (_event, pref = 'auto') => {
    return applyThemePreference(pref, { persist: true });
  });

  ipcMain.handle('config:summary', async () => {
    const cfg = getSportsDataConfig();
    const timezone = getAppTimezone();
    const remembered = Boolean(cfg.remembered);
    return {
      baseUrl: cfg.baseUrl,
      // Prefill email from .env if present, but only auto-login when remembered.
      email: cfg.email || '',
      password: remembered ? cfg.password || '' : '',
      hasPassword: remembered && Boolean(cfg.password),
      remembered,
      timezone,
      subjectToday: buildCorrlinksSubject(),
      envPath,
      credentialsPath: cfg.credentialsPath,
    };
  });

  ipcMain.handle('config:saveSportsData', async (_event, payload = {}) => {
    try {
      const saved = saveSportsDataCredentials({
        email: payload.email,
        password: payload.password,
        baseUrl: payload.baseUrl,
        remember: payload.remember !== false,
      });
      return {
        ok: true,
        message: saved.remembered ? 'SportsData login saved' : 'SportsData login applied for this session',
        baseUrl: saved.baseUrl,
        email: saved.email,
        hasPassword: Boolean(saved.password),
        credentialsPath: saved.credentialsPath,
        remembered: saved.remembered,
      };
    } catch (error) {
      return {
        ok: false,
        message: error.message || 'Failed to save SportsData login',
      };
    }
  });

  /** Verify SportsData email/password against the live site before opening the app. */
  ipcMain.handle('config:verifySportsData', async () => {
    try {
      sportsData.resetSession();
      const result = await sportsData.login();
      return {
        ok: true,
        message: 'SportsData login verified',
        email: result.email || getSportsDataConfig().email,
      };
    } catch (error) {
      sportsData.resetSession();
      return {
        ok: false,
        message: error.message || 'SportsData login failed — check email/password',
      };
    }
  });

  ipcMain.handle('config:logoutSportsData', async () => {
    try {
      forceCloseCorrWindow();
      sportsData.resetSession();
      cachedAccounts = [];
      clearCorrlinksVerifyCache();
      const cleared = clearSportsDataCredentials();
      return {
        ok: true,
        message: 'Signed out of SportsData',
        baseUrl: cleared.baseUrl,
        email: '',
        hasPassword: false,
        remembered: false,
        credentialsPath: cleared.credentialsPath,
      };
    } catch (error) {
      return {
        ok: false,
        message: error.message || 'Failed to sign out',
      };
    }
  });

  ipcMain.handle('corrlinksVerify:fingerprint', async (_event, accounts = []) => ({
    ok: true,
    fingerprint: fingerprintCorrlinksAccounts(accounts),
  }));

  ipcMain.handle('corrlinksVerify:load', async () => {
    const cache = loadCorrlinksVerifyCache();
    return cache
      ? { ok: true, ...cache }
      : { ok: false, fingerprint: null, probes: {}, savedAt: 0 };
  });

  ipcMain.handle('corrlinksVerify:save', async (_event, payload = {}) => {
    try {
      const saved = saveCorrlinksVerifyCache(payload);
      return { ok: true, ...saved };
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to save verify cache' };
    }
  });

  ipcMain.handle('corrlinksVerify:clear', async () => clearCorrlinksVerifyCache());

  ipcMain.handle('accounts:list', async () => ({
    ok: true,
    accounts: cachedAccounts,
  }));

  ipcMain.handle('accounts:refresh', async () => {
    try {
      const result = await sportsData.fetchCorrlinksAccounts();
      cachedAccounts = result.accounts;
      return {
        ok: true,
        message: result.message,
        accounts: cachedAccounts,
        inmateCount: result.inmateCount,
      };
    } catch (error) {
      return {
        ok: false,
        message: error.message || 'Failed to refresh accounts',
        accounts: cachedAccounts,
      };
    }
  });

  ipcMain.handle('corrlinks:login', async (_event, payload = {}) => {
    try {
      let status;
      const send = Boolean(payload.send);
      if (payload.inmateId != null) {
        const inmate = cachedAccounts.find((a) => String(a.id) === String(payload.inmateId));
        if (!inmate) {
          return {
            ok: false,
            status: { state: 'error', message: `Inmate ${payload.inmateId} not in cache — refresh accounts` },
          };
        }
        const template = resolveTemplateOptions(payload, inmate);
        status = await loginInmate(inmate, {
          fetchFileText: (url) => sportsData.fetchExchangeFileText(url),
          subject: template.subject,
          exchangeFiles: template.exchangeFiles,
          send,
          preferVia: payload.preferVia || null,
          loginEmail: payload.loginEmail || null,
        });
      } else {
        const template = resolveTemplateOptions(payload);
        status = await loginToCorrlinks({
          email: payload.email,
          password: payload.password,
          secondEmail: payload.secondEmail,
          secondPassword: payload.secondPassword,
          subject: template.subject,
          exchangeParts: template.exchangeFiles || [],
          send,
        });
      }

      const ok =
        status.state === 'success' ||
        status.state === 'manual' ||
        status.state === 'locked' ||
        Boolean(status.sent);
      return { ok, status };
    } catch (error) {
      return {
        ok: false,
        status: {
          state: 'error',
          message: error.message || 'CorrLinks login failed',
        },
      };
    }
  });

  /** Single-inmate login + compose + Send for every selected exchange file. Loop must not use this. */
  ipcMain.handle('corrlinks:sendInmate', async (_event, payload = {}) => {
    try {
      const inmate = cachedAccounts.find((a) => String(a.id) === String(payload.inmateId));
      if (!inmate) {
        return {
          ok: false,
          status: {
            state: 'error',
            message: `Inmate ${payload.inmateId} not in cache — refresh accounts`,
          },
        };
      }
      const template = resolveTemplateOptions(payload, inmate);
      const status = await loginInmate(inmate, {
        fetchFileText: (url) => sportsData.fetchExchangeFileText(url),
        subject: template.subject,
        exchangeFiles: template.exchangeFiles,
        send: true,
        preferVia: payload.preferVia || null,
        loginEmail: payload.loginEmail || null,
      });
      const ok =
        Boolean(status.sent) ||
        (status.state === 'success' && Boolean(status.sendSummary?.sent));
      return { ok, status };
    } catch (error) {
      return {
        ok: false,
        status: {
          state: 'error',
          message: error.message || 'CorrLinks send failed',
        },
      };
    }
  });

  /** Login only (no compose) — used by grouped Start loop. */
  ipcMain.handle('corrlinks:loginAccount', async (_event, payload = {}) => {
    try {
      const status = await loginAccount({
        email: payload.email,
        password: payload.password,
        secondEmail: payload.secondEmail,
        secondPassword: payload.secondPassword,
      });
      const ok =
        status.state === 'success' ||
        status.state === 'manual' ||
        (status.state === 'locked' && status.loggedIn);
      return { ok, status };
    } catch (error) {
      return {
        ok: false,
        status: {
          state: 'error',
          message: error.message || 'CorrLinks account login failed',
        },
      };
    }
  });

  ipcMain.handle('corrlinks:logout', async () => {
    try {
      const status = await logoutCorrlinksSession();
      return { ok: true, status };
    } catch (error) {
      return {
        ok: false,
        status: {
          state: 'error',
          message: error.message || 'CorrLinks logout failed',
        },
      };
    }
  });

  /** Hard-stop CorrLinks (destroy panel) so a running loop can abort mid-login/compose. */
  ipcMain.handle('corrlinks:forceStop', async () => {
    try {
      // Clear cookies first so the next probe does not inherit "already logged in".
      await clearAndCloseCorrWindow();
      return { ok: true, status: getStatus() };
    } catch (error) {
      return {
        ok: false,
        status: {
          state: 'error',
          message: error.message || 'CorrLinks force stop failed',
        },
      };
    }
  });

  /** Compose (+ optional Send) one recipient on the current CorrLinks session (no login). */
  ipcMain.handle('corrlinks:composeInmate', async (_event, payload = {}) => {
    try {
      const inmate = cachedAccounts.find((a) => String(a.id) === String(payload.inmateId));
      if (!inmate) {
        return {
          ok: false,
          status: {
            state: 'error',
            message: `Inmate ${payload.inmateId} not in cache — refresh accounts`,
          },
        };
      }
      const template = resolveTemplateOptions(payload);
      const send = Boolean(payload.send);
      const status = await composeForInmate(inmate, {
        fetchFileText: (url) => sportsData.fetchExchangeFileText(url),
        subject: template.subject,
        exchangeFiles: template.exchangeFiles,
        send,
      });
      const ok = send
        ? Boolean(status.sent) ||
          (Boolean(status.sendSummary?.sent) && !status.sendSummary?.failed)
        : status.state === 'success' ||
          Boolean(status.recipient?.ok) ||
          Boolean(status.bodyResult?.ok);
      return { ok, status };
    } catch (error) {
      return {
        ok: false,
        status: {
          state: 'error',
          message: error.message || 'CorrLinks compose failed',
        },
      };
    }
  });

  ipcMain.handle('corrlinks:status', async () => getStatus());
  ipcMain.handle('corrlinks:setBounds', async (_event, payload = {}) => {
    const force = Boolean(payload?.force);
    const { force: _forceFlag, ...bounds } = payload || {};
    return setCorrBounds(bounds, { force });
  });

  ipcMain.handle('corrlinks:reload', async () => reloadCorrlinksPanel());
  ipcMain.handle('corrlinks:openExternal', async () => openCorrlinksExternal());
  ipcMain.handle('corrlinks:clearSession', async () => clearCorrlinksPanelSession());
  ipcMain.handle('corrlinks:warmPanel', async (_event, payload = {}) => {
    try {
      return await warmCorrlinksPanel(payload || {});
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to open CorrLinks panel' };
    }
  });

  /** Prefetch exchange TXT bodies so single-send does not stall on download. */
  ipcMain.handle('exchange:prefetch', async (_event, payload = {}) => {
    try {
      let files = Array.isArray(payload.files) ? payload.files : [];
      if ((!files.length) && payload.inmateId != null) {
        const inmate = cachedAccounts.find((a) => String(a.id) === String(payload.inmateId));
        const sendable = inmate?.inmate_exchange?.sendable || [];
        if (Array.isArray(payload.selectedFiles) && payload.selectedFiles.length) {
          const keys = payload.selectedFiles.map(String);
          files = sendable.filter((file, index) => {
            const key = `${file.part}:${file.filename || index}`;
            return keys.includes(key);
          });
        } else {
          files = sendable;
        }
      }
      return await sportsData.prefetchExchangeFiles(files);
    } catch (error) {
      return { ok: false, message: error.message || 'Prefetch failed' };
    }
  });
  ipcMain.handle('corrlinks:zoom', async (_event, payload = {}) => zoomCorrlinksPanel(payload || {}));
  ipcMain.handle('corrlinks:hasSession', async () => hasCorrlinksPanelSession());

  ipcMain.handle('exchange:weekly', async (_event, payload = {}) => {
    try {
      const league = normalizeWeeklyLeague(payload.league);
      const result = await sportsData.fetchInmateExchangeWeekly({
        league: league === 'CFB' ? 'CFB' : league,
        withCharacters: payload.withCharacters !== false,
      });
      if (!result.ok) {
        return {
          ok: false,
          updates: [],
          message: result.message || 'Weekly updates unavailable',
        };
      }
      return {
        ok: true,
        league: league || null,
        subject: league ? buildWeeklySubject(league) : null,
        week_start: result.week_start,
        week_end: result.week_end,
        updates: result.updates,
        message: result.message,
      };
    } catch (error) {
      return {
        ok: false,
        updates: [],
        message: error.message || 'Failed to load weekly updates',
      };
    }
  });

  ipcMain.handle('exchange:history', async (_event, payload = {}) => {
    try {
      const result = await sportsData.fetchInmateExchangeHistory({
        withCharacters: payload.withCharacters !== false,
      });
      return { ok: true, ...result };
    } catch (error) {
      return {
        ok: false,
        message: error.message || 'Failed to load exchange history',
        rows: [],
      };
    }
  });

  ipcMain.handle('exchange:generateAll', async (_event, payload = {}) => {
    try {
      const date = payload.date ? String(payload.date).trim() : null;
      const result = await sportsData.generateInmateExchangeAll({ date: date || null });
      return {
        ok: Boolean(result?.ok),
        message: result?.message || null,
        date: result?.date || date || null,
        file: result?.file || null,
        url: result?.url || null,
        items: result?.items || [],
      };
    } catch (error) {
      return {
        ok: false,
        message: error.message || 'Failed to generate today’s exchange export',
        items: [],
      };
    }
  });

  ipcMain.handle('exchange:preview', async (_event, payload = {}) => {
    try {
      if (!payload.url) throw new Error('File URL is required');
      const file = await sportsData.fetchExchangeFileText(payload.url);
      return {
        ok: true,
        url: file.url,
        text: file.text,
        characters: file.characters,
        date: payload.date || null,
        filename: payload.filename || path.basename(String(payload.url).split('?')[0]) || 'all.txt',
      };
    } catch (error) {
      return {
        ok: false,
        message: error.message || 'Failed to preview exchange file',
      };
    }
  });

  ipcMain.handle('exchange:download', async (_event, payload = {}) => {
    try {
      if (!payload.url) throw new Error('File URL is required');
      const file = await sportsData.fetchExchangeFileText(payload.url);
      const text = applyContinuationPrefix(file.text || '', {
        part: payload.part,
        continuation: payload.continuation,
        index: payload.index,
      });
      const suggested =
        payload.suggestedName ||
        (payload.date ? `inmate-exchange-all-${payload.date}.txt` : 'inmate-exchange-all.txt');
      const result = await dialog.showSaveDialog(controlWindow, {
        title: 'Save exchange export',
        defaultPath: suggested,
        filters: [{ name: 'Text files', extensions: ['txt'] }],
      });
      if (result.canceled || !result.filePath) {
        return { ok: false, canceled: true };
      }
      await fs.writeFile(result.filePath, text, 'utf8');
      return {
        ok: true,
        path: result.filePath,
        characters: text.length,
      };
    } catch (error) {
      return {
        ok: false,
        message: error.message || 'Failed to download exchange file',
      };
    }
  });
}

app.whenReady().then(() => {
  reloadSavedCredentials();
  uiPreferences = loadUiPreferences();
  applyThemePreference(uiPreferences.theme, { persist: false });
  registerIpc();
  registerUpdateIpc({
    allowQuitForUpdate: () => {
      // Tear down CorrLinks so quitAndInstall / replace-install can exit cleanly.
      try {
        forceCloseCorrWindow();
      } catch (_) {}
    },
  });
  createControlWindow();
  nativeTheme.on('updated', () => {
    applyWindowChromeTheme();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createControlWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
