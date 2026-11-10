const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
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
} = require('./corrlinksLogin');
const {
  getSportsDataConfig,
  getAppTimezone,
  envPath,
  saveSportsDataCredentials,
  clearSportsDataCredentials,
  reloadSavedCredentials,
} = require('./config');
const { buildCorrlinksSubject } = require('./subject');

let controlWindow = null;
let cachedAccounts = [];
const sportsData = new SportsDataClient();

function createControlWindow() {
  controlWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'CorrLinks Automation',
    backgroundColor: '#07131c',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  setHostWindow(controlWindow);
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

function registerIpc() {
  ipcMain.handle('config:summary', async () => {
    const cfg = getSportsDataConfig();
    const timezone = getAppTimezone();
    return {
      baseUrl: cfg.baseUrl,
      email: cfg.email,
      password: cfg.password || '',
      hasPassword: Boolean(cfg.password),
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
      const cleared = clearSportsDataCredentials();
      return {
        ok: true,
        message: 'Signed out of SportsData',
        baseUrl: cleared.baseUrl,
        email: '',
        hasPassword: false,
        credentialsPath: cleared.credentialsPath,
      };
    } catch (error) {
      return {
        ok: false,
        message: error.message || 'Failed to sign out',
      };
    }
  });

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
      if (payload.inmateId != null) {
        const inmate = cachedAccounts.find((a) => String(a.id) === String(payload.inmateId));
        if (!inmate) {
          return {
            ok: false,
            status: { state: 'error', message: `Inmate ${payload.inmateId} not in cache — refresh accounts` },
          };
        }
        status = await loginInmate(inmate, {
          fetchFileText: (url) => sportsData.fetchExchangeFileText(url),
        });
      } else {
        status = await loginToCorrlinks({
          email: payload.email,
          password: payload.password,
          secondEmail: payload.secondEmail,
          secondPassword: payload.secondPassword,
        });
      }

      const ok = status.state === 'success' || status.state === 'manual' || status.state === 'locked';
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

  /** Compose one recipient on the current CorrLinks session (no login). */
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
      const status = await composeForInmate(inmate, {
        fetchFileText: (url) => sportsData.fetchExchangeFileText(url),
      });
      const ok =
        status.state === 'success' ||
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
  ipcMain.handle('corrlinks:setBounds', async (_event, bounds) => setCorrBounds(bounds || {}));
}

app.whenReady().then(() => {
  reloadSavedCredentials();
  registerIpc();
  createControlWindow();

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
