const { contextBridge, ipcRenderer } = require('electron');

function readSavedTheme() {
  try {
    const result = ipcRenderer.sendSync('ui:getThemePreferenceSync');
    if (result && (result.preference === 'light' || result.preference === 'dark' || result.preference === 'auto')) {
      return result;
    }
  } catch (_) {}
  return { preference: 'auto', resolved: 'dark' };
}

function applyThemeToDocument(preference, resolved) {
  try {
    const root = document.documentElement;
    if (!root) return;
    root.dataset.themePref = preference;
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved;
  } catch (_) {}
}

const bootTheme = readSavedTheme();
applyThemeToDocument(bootTheme.preference, bootTheme.resolved);
// Keep a sync snapshot for theme-boot.js / early renderer code.
contextBridge.exposeInMainWorld('__IEA_THEME_BOOT__', bootTheme);

contextBridge.exposeInMainWorld('api', {
  refreshAccounts: () => ipcRenderer.invoke('accounts:refresh'),
  listAccounts: () => ipcRenderer.invoke('accounts:list'),
  loginCorrlinks: (payload) => ipcRenderer.invoke('corrlinks:login', payload),
  loginCorrlinksAccount: (payload) => ipcRenderer.invoke('corrlinks:loginAccount', payload),
  sendCorrlinksInmate: (payload) => ipcRenderer.invoke('corrlinks:sendInmate', payload),
  logoutCorrlinks: () => ipcRenderer.invoke('corrlinks:logout'),
  forceStopCorrlinks: () => ipcRenderer.invoke('corrlinks:forceStop'),
  composeCorrlinksInmate: (payload) => ipcRenderer.invoke('corrlinks:composeInmate', payload),
  getCorrlinksStatus: () => ipcRenderer.invoke('corrlinks:status'),
  onCorrlinksStatus: (handler) => {
    const listener = (_event, payload) => handler(payload);
    ipcRenderer.on('corrlinks:status', listener);
    return () => ipcRenderer.removeListener('corrlinks:status', listener);
  },
  setCorrBounds: (bounds) => ipcRenderer.invoke('corrlinks:setBounds', bounds),
  reloadCorrlinksPanel: () => ipcRenderer.invoke('corrlinks:reload'),
  openCorrlinksExternal: () => ipcRenderer.invoke('corrlinks:openExternal'),
  clearCorrlinksPanel: () => ipcRenderer.invoke('corrlinks:clearSession'),
  warmCorrlinksPanel: (payload) => ipcRenderer.invoke('corrlinks:warmPanel', payload || {}),
  prefetchExchangeFiles: (payload) => ipcRenderer.invoke('exchange:prefetch', payload),
  zoomCorrlinksPanel: (payload) => ipcRenderer.invoke('corrlinks:zoom', payload),
  hasCorrlinksSession: () => ipcRenderer.invoke('corrlinks:hasSession'),
  getConfigSummary: () => ipcRenderer.invoke('config:summary'),
  saveSportsDataLogin: (payload) => ipcRenderer.invoke('config:saveSportsData', payload),
  verifySportsDataLogin: () => ipcRenderer.invoke('config:verifySportsData'),
  logoutSportsData: () => ipcRenderer.invoke('config:logoutSportsData'),
  fingerprintCorrlinksAccounts: (accounts) =>
    ipcRenderer.invoke('corrlinksVerify:fingerprint', accounts),
  loadCorrlinksVerifyCache: () => ipcRenderer.invoke('corrlinksVerify:load'),
  saveCorrlinksVerifyCache: (payload) => ipcRenderer.invoke('corrlinksVerify:save', payload),
  clearCorrlinksVerifyCache: () => ipcRenderer.invoke('corrlinksVerify:clear'),
  fetchExchangeHistory: (payload) => ipcRenderer.invoke('exchange:history', payload),
  generateExchangeAll: (payload) => ipcRenderer.invoke('exchange:generateAll', payload),
  fetchExchangeWeekly: (payload) => ipcRenderer.invoke('exchange:weekly', payload),
  previewExchangeFile: (payload) => ipcRenderer.invoke('exchange:preview', payload),
  downloadExchangeFile: (payload) => ipcRenderer.invoke('exchange:download', payload),
  getUpdateStatus: () => ipcRenderer.invoke('update:getStatus'),
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  onUpdateStatus: (handler) => {
    const listener = (_event, payload) => handler(payload);
    ipcRenderer.on('update:status', listener);
    return () => ipcRenderer.removeListener('update:status', listener);
  },
  getThemePreference: () => ipcRenderer.invoke('ui:getThemePreference'),
  setThemePreference: (pref) => ipcRenderer.invoke('ui:setThemePreference', pref),
});
