const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const { SportsDataClient } = require('./sportsdataClient');
const { loginToCorrlinks, loginInmate, getStatus } = require('./corrlinksLogin');
const {
  getSportsDataConfig,
  getAppTimezone,
  envPath,
  saveSportsDataCredentials,
  reloadSavedCredentials,
} = require('./config');
const { buildCorrlinksSubject } = require('./subject');

let controlWindow = null;
let cachedAccounts = [];
const sportsData = new SportsDataClient();

function createControlWindow() {
  controlWindow = new BrowserWindow({
    width: 760,
    height: 900,
    title: 'Inmate Exchange Auto — CorrLinks Phase 1',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  controlWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  controlWindow.on('closed', () => {
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

  ipcMain.handle('corrlinks:status', async () => getStatus());
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
