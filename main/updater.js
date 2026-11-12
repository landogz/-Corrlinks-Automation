const { app, ipcMain, shell } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

/** @type {import('electron').BrowserWindow | null} */
let hostWindow = null;

/** Optional hook from main — skip close-confirm when quitting to install an update. */
let allowQuitForUpdate = null;

function markQuitForUpdate() {
  if (typeof allowQuitForUpdate === 'function') {
    try {
      allowQuitForUpdate();
    } catch (_) {}
  }
}

/** @type {import('electron-updater').AppUpdater | null} */
let autoUpdater = null;

/** @type {string|null} */
let downloadedUpdateFile = null;

/** @type {{
 *   state: 'idle'|'checking'|'available'|'not-available'|'downloading'|'downloaded'|'error'|'dev',
 *   currentVersion: string,
 *   latestVersion: string|null,
 *   percent: number|null,
 *   message: string,
 *   error: string|null,
 *   installMode: 'squirrel'|'replace'|'dmg'|null,
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

function macInstallMode() {
  // Unsigned builds cannot use Squirrel.Mac/ShipIt — replace the .app ourselves.
  return 'replace';
}

function macDmgUrl(version) {
  const v = String(version || '').replace(/^v/, '');
  if (!v) return null;
  const archSuffix = process.arch === 'arm64' ? '-arm64' : '';
  const file = `Inmate-Exchange-Auto-${v}${archSuffix}.dmg`;
  return `https://github.com/landogz/-Corrlinks-Automation/releases/download/v${v}/${file}`;
}

/** Running bundle: …/Inmate Exchange Auto.app */
function getCurrentAppBundle() {
  return path.resolve(process.execPath, '..', '..', '..');
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
      installMode: isMac() ? macInstallMode() : 'squirrel',
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
    if (info?.downloadedFile) {
      downloadedUpdateFile = info.downloadedFile;
    }
    setState({
      state: 'downloaded',
      latestVersion: version,
      percent: 100,
      message: downloadedMessage(version),
      error: null,
      installMode: isMac() ? macInstallMode() : 'squirrel',
    });
  });

  updater.on('error', (error) => {
    const raw = error?.message || String(error);
    // If ShipIt signature fails but we already have a zip, keep "downloaded" for replace install.
    if (
      isMac() &&
      downloadedUpdateFile &&
      /code signature|ShipIt|did not pass validation/i.test(raw)
    ) {
      setState({
        state: 'downloaded',
        message: downloadedMessage(updateState.latestVersion),
        error: null,
        installMode: 'replace',
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

async function openMacInstallerFallback(version = updateState.latestVersion) {
  const url = macDmgUrl(version);
  if (!url) {
    return { ok: false, message: 'No macOS installer URL for this version' };
  }
  await shell.openExternal(url);
  setState({
    state: 'downloaded',
    latestVersion: version,
    message: `Opened DMG for v${version} — drag to Applications, then relaunch`,
    error: null,
    installMode: 'dmg',
  });
  return { ok: true, url, ...updateState };
}

/**
 * Install unsigned Mac update by replacing the .app bundle (bypasses ShipIt codesign).
 * Relaunch is done from a detached shell after this process fully exits — `open` alone
 * often fails to bring the new instance frontmost (or races the quitting process).
 */
function installMacUpdateByReplace(zipPath) {
  if (!zipPath || !fs.existsSync(zipPath)) {
    throw new Error('Downloaded update zip not found');
  }

  const destApp = getCurrentAppBundle();
  if (!destApp.endsWith('.app') || !fs.existsSync(destApp)) {
    throw new Error(`Current app bundle not found at ${destApp}`);
  }

  const stamp = Date.now();
  const extractDir = path.join(os.tmpdir(), `iea-update-${stamp}`);
  const scriptPath = path.join(os.tmpdir(), `iea-install-${stamp}.sh`);
  const logPath = path.join(os.tmpdir(), `iea-install-${stamp}.log`);
  const appPid = process.pid;
  const macOsDir = path.join(destApp, 'Contents/MacOS');
  const appName = path.basename(destApp, '.app');
  const binaryPath = path.join(macOsDir, appName);

  const script = `#!/bin/bash
set -uo pipefail
ZIP=${JSON.stringify(zipPath)}
EXTRACT=${JSON.stringify(extractDir)}
DEST=${JSON.stringify(destApp)}
LOG=${JSON.stringify(logPath)}
APP_PID=${JSON.stringify(String(appPid))}
MACOS_DIR=${JSON.stringify(macOsDir)}
APP_NAME=${JSON.stringify(appName)}
BIN=${JSON.stringify(binaryPath)}
SCRIPT=${JSON.stringify(scriptPath)}

exec > >(tee -a "$LOG") 2>&1
echo "Installing update from $ZIP (waiting for pid $APP_PID to exit)"
rm -rf "$EXTRACT"
mkdir -p "$EXTRACT"
ditto -x -k "$ZIP" "$EXTRACT"
NEW_APP="$(find "$EXTRACT" -name "$APP_NAME.app" -type d | head -n 1 || true)"
if [[ -z "$NEW_APP" ]]; then
  NEW_APP="$(find "$EXTRACT" -name '*.app' -type d | head -n 1 || true)"
fi
if [[ -z "$NEW_APP" ]]; then
  echo "No .app found inside update zip"
  exit 1
fi
echo "Found new app: $NEW_APP"

# Wait for this Electron process to exit (prefer PID over fuzzy pgrep).
for i in $(seq 1 120); do
  if ! kill -0 "$APP_PID" 2>/dev/null; then
    echo "App pid $APP_PID exited"
    break
  fi
  sleep 0.25
done
if kill -0 "$APP_PID" 2>/dev/null; then
  echo "App pid $APP_PID still alive — force kill"
  kill -TERM "$APP_PID" 2>/dev/null || true
  sleep 1
  kill -KILL "$APP_PID" 2>/dev/null || true
fi

# Sweep leftover helpers still bound to the old bundle path.
pkill -KILL -f "$MACOS_DIR/" >/dev/null 2>&1 || true
sleep 1

echo "Replacing $DEST"
rm -rf "$DEST"
ditto "$NEW_APP" "$DEST"
xattr -dr com.apple.quarantine "$DEST" 2>/dev/null || true
chmod -R u+rwX "$DEST" 2>/dev/null || true

echo "Launching $DEST"
launched=0
for attempt in 1 2 3 4 5 6; do
  echo "Relaunch attempt $attempt"
  open -n "$DEST" >/dev/null 2>&1 || true
  sleep 1.5
  if pgrep -f "$MACOS_DIR/" >/dev/null 2>&1; then
    launched=1
    break
  fi
  if [[ -x "$BIN" ]]; then
    echo "open did not stick — spawning binary directly"
    nohup "$BIN" >/dev/null 2>&1 &
    sleep 1.5
    if pgrep -f "$MACOS_DIR/" >/dev/null 2>&1; then
      launched=1
      break
    fi
  fi
done

/usr/bin/osascript -e "tell application \\"$APP_NAME\\" to activate" >/dev/null 2>&1 || \\
  /usr/bin/osascript -e "tell application \\"System Events\\" to set frontmost of first process whose name is \\"$APP_NAME\\" to true" >/dev/null 2>&1 || true

if [[ "$launched" -eq 1 ]]; then
  echo "Relaunch ok"
else
  echo "Relaunch FAILED — open the app from Applications manually"
fi

rm -rf "$EXTRACT"
rm -f "$SCRIPT"
`;

  fs.writeFileSync(scriptPath, script, { mode: 0o755 });
  const child = spawn('/bin/bash', [scriptPath], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  setState({
    state: 'downloaded',
    message: 'Installing update — app will relaunch…',
    error: null,
    installMode: 'replace',
  });

  // Forceful exit so the install script is not stuck waiting on a half-quit app.
  setTimeout(() => {
    markQuitForUpdate();
    try {
      app.exit(0);
    } catch (_) {
      app.quit();
    }
  }, 350);

  return { ok: true, mode: 'replace', logPath, ...updateState };
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
  // Never let Squirrel.Mac auto-apply on unsigned builds.
  updater.autoInstallOnAppQuit = !isMac();
  updater.allowPrerelease = false;
  bindUpdaterEvents(updater);

  // Renderer checks for updates on the login screen before SportsData auth.
}

function registerUpdateIpc(options = {}) {
  if (typeof options.allowQuitForUpdate === 'function') {
    allowQuitForUpdate = options.allowQuitForUpdate;
  }
  ipcMain.handle('update:getStatus', async () => ({
    ...updateState,
    currentVersion: currentVersion(),
    downloadedFile: downloadedUpdateFile,
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
      bindUpdaterEvents(updater);
      downloadedUpdateFile = null;
      setState({
        state: 'downloading',
        message: 'Downloading update…',
        percent: 0,
        error: null,
        installMode: isMac() ? macInstallMode() : 'squirrel',
      });
      await updater.downloadUpdate();
      return { ok: true, ...updateState, downloadedFile: downloadedUpdateFile };
    } catch (error) {
      // Mac: if download actually finished but ShipIt errored, still allow replace install.
      if (isMac() && downloadedUpdateFile && fs.existsSync(downloadedUpdateFile)) {
        setState({
          state: 'downloaded',
          message: downloadedMessage(updateState.latestVersion),
          error: null,
          installMode: 'replace',
          percent: 100,
        });
        return { ok: true, ...updateState, downloadedFile: downloadedUpdateFile };
      }
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

    if (isMac()) {
      try {
        if (downloadedUpdateFile && fs.existsSync(downloadedUpdateFile)) {
          return installMacUpdateByReplace(downloadedUpdateFile);
        }
        // No zip cached — fall back to DMG for this one edge case.
        return openMacInstallerFallback(updateState.latestVersion);
      } catch (error) {
        setState({
          state: 'error',
          message: 'Install failed',
          error: error?.message || String(error),
        });
        try {
          return await openMacInstallerFallback(updateState.latestVersion);
        } catch (_) {
          return { ok: false, ...updateState };
        }
      }
    }

    const updater = getAutoUpdater();
    markQuitForUpdate();
    // isSilent=false, isForceRunAfter=true — quit + relaunch after Windows install.
    setTimeout(() => {
      try {
        updater.quitAndInstall(false, true);
      } catch (error) {
        console.error('[updater] quitAndInstall failed:', error);
        try {
          app.exit(0);
        } catch (_) {}
      }
    }, 250);
    return { ok: true };
  });
}

module.exports = {
  setupAutoUpdater,
  registerUpdateIpc,
};
