const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");

const isDev = !app.isPackaged;
let mainWindow;
let serverStarted = false;
const resolvedUserData = process.env.USER_DATA_PATH || app.getPath("userData");
const dbPath = path.join(resolvedUserData, "data", "app.db");
const uploadsDir = path.join(resolvedUserData, "uploads");
const serverPort = process.env.PORT || 3000;

function ensurePaths() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.mkdirSync(uploadsDir, { recursive: true });
  process.env.USER_DATA_PATH = resolvedUserData;
  process.env.DATABASE_URL = `file:${dbPath}`;
  process.env.UPLOADS_DIR = uploadsDir;
}

async function startProductionServer() {
  if (serverStarted) return `http://localhost:${serverPort}`;

  const standaloneDir = path.join(process.resourcesPath, "app", ".next", "standalone");
  const serverPath = path.join(standaloneDir, "server.js");

  if (!fs.existsSync(serverPath)) {
    throw new Error("Manjka Next standalone build. Zaženite `npm run electron:build`.");
  }

  process.chdir(standaloneDir);
  process.env.PORT = serverPort;
  process.env.NODE_ENV = "production";

  require(serverPath);
  serverStarted = true;
  await waitForServer(`http://localhost:${serverPort}`);
  return `http://localhost:${serverPort}`;
}

function waitForServer(url) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      http
        .get(url, () => resolve(true))
        .on("error", () => {
          if (Date.now() - start > 15000) {
            reject(new Error("Strežnik Next se ni zagnal pravočasno"));
          } else {
            setTimeout(check, 500);
          }
        });
    };
    check();
  });
}

async function createWindow() {
  ensurePaths();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const targetUrl = isDev ? "http://localhost:3000" : await startProductionServer();
  await mainWindow.loadURL(targetUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.on("ready", async () => {
  try {
    await createWindow();
  } catch (error) {
    console.error("Napaka pri zagonu okna:", error);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});
