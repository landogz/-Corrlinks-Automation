const { app, ipcMain } = require('electron');

/** @type {import('electron').BrowserWindow | null} */
let hostWindow = null;

/** @type {import('electron-updater').AppUpdater | null} */
let autoUpdater = null;

/** @type {{
 *   state: 'idle'|'checking'|'available'|'not-available'|'downloading'|'downloaded'|'error'|'dev',
 *   currentVersion: string,
 *   latestVersion: string|null,
 *   percent: number|null,
 *   message: string,
 *   error: string|null,
 * }} */
let updateState = {
  state: 'idle',
  currentVersion: '',
  latestVersion: null,
  percent: null,
  message: 'Ready',
  error: null,
};

function isPackaged() {
  return app.isPackaged;
}

function currentVersion() {
  try {
    return app.getVersion();
  } catch {
    return updateState.currentVersion || '';
  }
}

function getAutoUpdater() {
  if (!autoUpdater) {
    ({ autoUpdater } = require('electron-updater'));
  }
  return autoUpdater;
}

function setState(patch) {
  updateState = {
    ...updateState,
    currentVersion: currentVersion(),
    ...patch,
  };
  emitStatus();
}

function emitStatus() {
  if (!hostWindow || hostWindow.isDestroyed()) return;
  hostWindow.webContents.send('update:status', { ...updateState });
}

function bindUpdaterEvents(updater) {
  updater.removeAllListeners();

  updater.on('checking-for-update', () => {
    setState({
      state: 'checking',
      message: 'Checking for updates…',
      error: null,
      percent: null,
    });
  });

  updater.on('update-available', (info) => {
    setState({
      state: 'available',
      latestVersion: info?.version || null,
      message: `Update available: v${info?.version || '?'}`,
      error: null,
      percent: null,
    });
  });

  updater.on('update-not-available', (info) => {
    setState({
      state: 'not-available',
      latestVersion: info?.version || currentVersion(),
      message: `Up to date (v${currentVersion()})`,
      error: null,
      percent: null,
    });
  });

  updater.on('download-progress', (progress) => {
    const percent = typeof progress?.percent === 'number' ? Math.round(progress.percent) : null;
    setState({
      state: 'downloading',
      percent,
      message: percent != null ? `Downloading update… ${percent}%` : 'Downloading update…',
      error: null,
    });
  });

  updater.on('update-downloaded', (info) => {
    setState({
      state: 'downloaded',
      latestVersion: info?.version || updateState.latestVersion,
      percent: 100,
      message: `Update ready — restart to install v${info?.version || updateState.latestVersion || ''}`,
      error: null,
    });
  });

  updater.on('error', (error) => {
    setState({
      state: 'error',
      message: 'Update check failed',
      error: error?.message || String(error),
      percent: null,
    });
  });
}

function setupAutoUpdater(win) {
  hostWindow = win || null;
  updateState.currentVersion = currentVersion();

  if (!isPackaged()) {
    setState({
      state: 'dev',
      message: 'Updates available in packaged builds only',
      error: null,
    });
    return;
  }

  const updater = getAutoUpdater();
  updater.autoDownload = false;
  updater.autoInstallOnAppQuit = true;
  updater.allowPrerelease = false;
  bindUpdaterEvents(updater);

  // Quiet startup check after the window settles.
  setTimeout(() => {
    updater.checkForUpdates().catch((error) => {
      setState({
        state: 'error',
        message: 'Update check failed',
        error: error?.message || String(error),
      });
    });
  }, 8000);
}

function registerUpdateIpc() {
  ipcMain.handle('update:getStatus', async () => ({
    ...updateState,
    currentVersion: currentVersion(),
  }));

  ipcMain.handle('update:check', async () => {
    if (!isPackaged()) {
      setState({
        state: 'dev',
        message: 'Updates available in packaged builds only',
        error: null,
      });
      return { ok: false, ...updateState };
    }
    try {
      const updater = getAutoUpdater();
      bindUpdaterEvents(updater);
      setState({
        state: 'checking',
        message: 'Checking for updates…',
        error: null,
        percent: null,
      });
      const result = await updater.checkForUpdates();
      return {
        ok: true,
        updateInfo: result?.updateInfo || null,
        ...updateState,
      };
    } catch (error) {
      setState({
        state: 'error',
        message: 'Update check failed',
        error: error?.message || String(error),
      });
      return { ok: false, ...updateState };
    }
  });

  ipcMain.handle('update:download', async () => {
    if (!isPackaged()) {
      return { ok: false, message: 'Updates available in packaged builds only', ...updateState };
    }
    try {
      const updater = getAutoUpdater();
      setState({
        state: 'downloading',
        message: 'Downloading update…',
        percent: 0,
        error: null,
      });
      await updater.downloadUpdate();
      return { ok: true, ...updateState };
    } catch (error) {
      setState({
        state: 'error',
        message: 'Download failed',
        error: error?.message || String(error),
      });
      return { ok: false, ...updateState };
    }
  });

  ipcMain.handle('update:install', async () => {
    if (!isPackaged()) {
      return { ok: false, message: 'Updates available in packaged builds only' };
    }
    const updater = getAutoUpdater();
    setImmediate(() => {
      updater.quitAndInstall(false, true);
    });
    return { ok: true };
  });
}

module.exports = {
  setupAutoUpdater,
  registerUpdateIpc,
};
