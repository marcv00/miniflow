import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("electronAPI", {
  saveJson: (content: string) => ipcRenderer.invoke("save-json", content),
  openJson: () => ipcRenderer.invoke("open-json")
})
