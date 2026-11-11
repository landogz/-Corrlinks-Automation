const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  refreshAccounts: () => ipcRenderer.invoke('accounts:refresh'),
  listAccounts: () => ipcRenderer.invoke('accounts:list'),
  loginCorrlinks: (payload) => ipcRenderer.invoke('corrlinks:login', payload),
  loginCorrlinksAccount: (payload) => ipcRenderer.invoke('corrlinks:loginAccount', payload),
  logoutCorrlinks: () => ipcRenderer.invoke('corrlinks:logout'),
  forceStopCorrlinks: () => ipcRenderer.invoke('corrlinks:forceStop'),
  composeCorrlinksInmate: (payload) => ipcRenderer.invoke('corrlinks:composeInmate', payload),
  getCorrlinksStatus: () => ipcRenderer.invoke('corrlinks:status'),
  setCorrBounds: (bounds) => ipcRenderer.invoke('corrlinks:setBounds', bounds),
  reloadCorrlinksPanel: () => ipcRenderer.invoke('corrlinks:reload'),
  openCorrlinksExternal: () => ipcRenderer.invoke('corrlinks:openExternal'),
  clearCorrlinksPanel: () => ipcRenderer.invoke('corrlinks:clearSession'),
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
});
