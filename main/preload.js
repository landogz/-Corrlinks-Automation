const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  refreshAccounts: () => ipcRenderer.invoke('accounts:refresh'),
  listAccounts: () => ipcRenderer.invoke('accounts:list'),
  loginCorrlinks: (payload) => ipcRenderer.invoke('corrlinks:login', payload),
  getCorrlinksStatus: () => ipcRenderer.invoke('corrlinks:status'),
  getConfigSummary: () => ipcRenderer.invoke('config:summary'),
});
