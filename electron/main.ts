import { app, BrowserWindow, dialog, ipcMain } from "electron"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"
import { spawn } from "child_process";

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    autoHideMenuBar: true,
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

ipcMain.handle("run-java-test", async (_event, folderName: string) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openDirectory"],
    title: "Selecciona dónde crear la carpeta"
  });

  if (canceled || filePaths.length === 0) return false;

  const selectedPath = filePaths[0];

  return new Promise((resolve) => {
    // 1. VERIFICA ESTA RUTA: Imprime en consola para ver dónde busca el JAR
    const jarPath = path.resolve(__dirname, "..", "dist-java-engine", "engine.jar");
    console.log("Buscando JAR en:", jarPath);

    if (!fs.existsSync(jarPath)) {
      console.error("ERROR: El archivo engine.jar no existe en esa ruta.");
      resolve(false);
      return;
    }

    const child = spawn("java", ["-jar", jarPath]);

    const fullWorkflowPayload = {
      name: "Test con Selector",
      nodes: [
        { id: "node-1", type: "START", data: {} },
        { 
          id: "node-2", 
          type: "CREATE_FOLDER", 
          data: { folderName: folderName, folderPath: selectedPath } 
        }
      ],
      edges: [{ source: "node-1", target: "node-2" }]
    };

    const jsonString = JSON.stringify(fullWorkflowPayload);
    console.log("Enviando JSON a Java:", jsonString);

    child.stdin.write(jsonString + "\n");
    child.stdin.end();

    // 2. CAPTURA DE SALIDA: Esto aparecerá en tu terminal de VS Code
    child.stdout.on("data", (data) => {
      console.log(`[Java Stdout]: ${data}`);
    });

    child.stderr.on("data", (data) => {
      console.error(`[Java Stderr]: ${data}`);
    });

    child.on("close", (code) => {
      console.log(`Proceso Java cerrado con código: ${code}`);
      resolve(true);
    });
  });
});

app.whenReady().then(createWindow)
