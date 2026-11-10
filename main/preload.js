const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  refreshAccounts: () => ipcRenderer.invoke('accounts:refresh'),
  listAccounts: () => ipcRenderer.invoke('accounts:list'),
  loginCorrlinks: (payload) => ipcRenderer.invoke('corrlinks:login', payload),
  loginCorrlinksAccount: (payload) => ipcRenderer.invoke('corrlinks:loginAccount', payload),
  logoutCorrlinks: () => ipcRenderer.invoke('corrlinks:logout'),
  composeCorrlinksInmate: (payload) => ipcRenderer.invoke('corrlinks:composeInmate', payload),
  getCorrlinksStatus: () => ipcRenderer.invoke('corrlinks:status'),
  setCorrBounds: (bounds) => ipcRenderer.invoke('corrlinks:setBounds', bounds),
  getConfigSummary: () => ipcRenderer.invoke('config:summary'),
  saveSportsDataLogin: (payload) => ipcRenderer.invoke('config:saveSportsData', payload),
  verifySportsDataLogin: () => ipcRenderer.invoke('config:verifySportsData'),
  logoutSportsData: () => ipcRenderer.invoke('config:logoutSportsData'),
});
