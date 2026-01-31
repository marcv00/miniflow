import { app, BrowserWindow, dialog, ipcMain } from "electron"
import path from "path"
import fs from "fs"

const isDev = !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  })

  if (isDev) {
    win.loadURL("http://localhost:5173")
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"))
  }
}

/* ========== IPC ========== */

ipcMain.handle("save-json", async (_, content: string) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    filters: [{ name: "Workflow", extensions: ["json"] }]
  })
  if (canceled || !filePath) return false
  fs.writeFileSync(filePath, content, "utf-8")
  return true
})

ipcMain.handle("open-json", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [{ name: "Workflow", extensions: ["json"] }],
    properties: ["openFile"]
  })
  if (canceled || !filePaths[0]) return null
  return fs.readFileSync(filePaths[0], "utf-8")
})

app.whenReady().then(createWindow)
