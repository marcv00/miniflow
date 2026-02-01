const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("electronAPI", {
  saveJson: (content:any) => ipcRenderer.invoke("save-json", content),
  openJson: () => ipcRenderer.invoke("open-json"),
  runJavaTest: (name:any) => ipcRenderer.invoke("run-java-test", name),
});