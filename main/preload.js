const { contextBridge, ipcRenderer } = require('electron');
const {
  THEMES,
  DENSITIES,
  TYPE_SCALES,
  listThemesByGroup,
} = require('../shared/appearance');

function readSavedAppearance() {
  try {
    const result = ipcRenderer.sendSync('ui:getThemePreferenceSync');
    if (result && result.preference) {
      return {
        preference: result.preference,
        resolved: result.resolved || result.preference,
        scheme: result.scheme || 'dark',
        density: result.density || 'comfortable',
        typeScale: result.typeScale || 'default',
        backgroundColor: result.backgroundColor || null,
        label: result.label || null,
      };
    }
  } catch (_) {}
  return {
    preference: 'auto',
    resolved: 'dark',
    scheme: 'dark',
    density: 'comfortable',
    typeScale: 'default',
    backgroundColor: '#0a0f16',
    label: 'Dark',
  };
}

function applyAppearanceToDocument(snap) {
  try {
    const root = document.documentElement;
    if (!root || !snap) return;
    root.dataset.themePref = snap.preference;
    root.dataset.theme = snap.resolved;
    root.dataset.scheme = snap.scheme;
    root.dataset.density = snap.density || 'comfortable';
    root.dataset.type = snap.typeScale || 'default';
    root.style.colorScheme = snap.scheme || 'dark';
  } catch (_) {}
}

const bootAppearance = readSavedAppearance();
applyAppearanceToDocument(bootAppearance);
// Keep a sync snapshot for theme-boot.js / early renderer code.
contextBridge.exposeInMainWorld('__IEA_THEME_BOOT__', bootAppearance);
contextBridge.exposeInMainWorld('__IEA_APPEARANCE__', {
  themes: THEMES,
  densities: DENSITIES,
  typeScales: TYPE_SCALES,
  groups: listThemesByGroup(),
});

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
  getSubjectToday: () => ipcRenderer.invoke('subject:today'),
  saveSportsDataLogin: (payload) => ipcRenderer.invoke('config:saveSportsData', payload),
  verifySportsDataLogin: () => ipcRenderer.invoke('config:verifySportsData'),
  logoutSportsData: () => ipcRenderer.invoke('config:logoutSportsData'),
  fingerprintCorrlinksAccounts: (accounts) =>
    ipcRenderer.invoke('corrlinksVerify:fingerprint', accounts),
  hashCorrlinksCredential: (payload) =>
    ipcRenderer.invoke('corrlinksVerify:credentialHash', payload || {}),
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
  setAppearance: (partial) => ipcRenderer.invoke('ui:setAppearance', partial || {}),
  getLoopSchedule: () => ipcRenderer.invoke('loopSchedule:get'),
  setLoopSchedule: (partial) => ipcRenderer.invoke('loopSchedule:set', partial || {}),
  markLoopScheduleFired: (nyDateOrPayload) =>
    ipcRenderer.invoke('loopSchedule:markFired', nyDateOrPayload),
  listSendHistory: () => ipcRenderer.invoke('sendHistory:list'),
  getSendHistory: (id) => ipcRenderer.invoke('sendHistory:get', id),
  appendSendHistory: (run) => ipcRenderer.invoke('sendHistory:append', run || {}),
  clearSendHistory: () => ipcRenderer.invoke('sendHistory:clear'),
});
