const { app, ipcMain, shell } = require('electron');

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
 *   installMode: 'squirrel'|'dmg'|null,
 * }} */
let updateState = {
  state: 'idle',
  currentVersion: '',
  latestVersion: null,
  percent: null,
  message: 'Ready',
  error: null,
  installMode: null,
};

function isPackaged() {
  return app.isPackaged;
}

function isMac() {
  return process.platform === 'darwin';
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

function macDmgUrl(version) {
  const v = String(version || '').replace(/^v/, '');
  if (!v) return null;
  const archSuffix = process.arch === 'arm64' ? '-arm64' : '';
  const file = `Inmate-Exchange-Auto-${v}${archSuffix}.dmg`;
  return `https://github.com/landogz/-Corrlinks-Automation/releases/download/v${v}/${file}`;
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

function downloadedMessage(version) {
  if (isMac()) {
    return `Update ready — open the installer for v${version || ''}`;
  }
  return `Update ready — restart to install v${version || ''}`;
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
      installMode: isMac() ? 'dmg' : 'squirrel',
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
    const version = info?.version || updateState.latestVersion;
    setState({
      state: 'downloaded',
      latestVersion: version,
      percent: 100,
      message: downloadedMessage(version),
      error: null,
      installMode: isMac() ? 'dmg' : 'squirrel',
    });
  });

  updater.on('error', (error) => {
    const raw = error?.message || String(error);
    // ShipIt signature failures are expected on unsigned mac builds — guide to DMG.
    if (isMac() && /code signature|ShipIt|did not pass validation/i.test(raw)) {
      const version = updateState.latestVersion;
      setState({
        state: 'downloaded',
        message: downloadedMessage(version),
        error: null,
        installMode: 'dmg',
      });
      return;
    }
    setState({
      state: 'error',
      message: 'Update check failed',
      error: raw,
      percent: null,
    });
  });
}

async function openMacInstaller(version = updateState.latestVersion) {
  const url = macDmgUrl(version);
  if (!url) {
    return { ok: false, message: 'No macOS installer URL for this version' };
  }
  await shell.openExternal(url);
  setState({
    state: 'downloaded',
    latestVersion: version,
    message: `Opened installer for v${version} — drag to Applications, then relaunch`,
    error: null,
    installMode: 'dmg',
  });
  return { ok: true, url, ...updateState };
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
  // Unsigned mac builds cannot use ShipIt quitAndInstall — open DMG instead.
  updater.autoInstallOnAppQuit = !isMac();
  updater.allowPrerelease = false;
  bindUpdaterEvents(updater);

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

    // macOS unsigned: skip ShipIt zip/apply — open the release DMG directly.
    if (isMac()) {
      const version = updateState.latestVersion;
      if (!version) {
        try {
          const updater = getAutoUpdater();
          bindUpdaterEvents(updater);
          await updater.checkForUpdates();
        } catch (_) {}
      }
      const target = updateState.latestVersion;
      if (!target) {
        return {
          ok: false,
          message: 'No update version available yet — check for updates first',
          ...updateState,
        };
      }
      setState({
        state: 'downloading',
        message: 'Opening macOS installer…',
        percent: 0,
        error: null,
        installMode: 'dmg',
      });
      return openMacInstaller(target);
    }

    try {
      const updater = getAutoUpdater();
      setState({
        state: 'downloading',
        message: 'Downloading update…',
        percent: 0,
        error: null,
        installMode: 'squirrel',
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

    if (isMac() || updateState.installMode === 'dmg') {
      return openMacInstaller(updateState.latestVersion);
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
