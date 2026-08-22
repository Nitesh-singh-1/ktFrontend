const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  quitAndInstall: () => ipcRenderer.invoke("quit-and-install"),
  
  onUpdateStatus: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on("update-status", subscription);
    return () => {
      ipcRenderer.removeListener("update-status", subscription);
    };
  },
  
  printToPDF: (options) => ipcRenderer.invoke("print-to-pdf", options),
  printDirect: () => ipcRenderer.invoke("print-direct"),
});
