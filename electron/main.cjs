const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const net = require("net");

const isDev = !app.isPackaged;
let mainWindow;
let serverStarted = false;
let serverPort = Number(process.env.PORT) || 3000;
const appDirName = "gradnja-stroski";
const templateDbName = "template.db";
const templatePdfName = "primer-racun.pdf";

const normalizeDbUrl = (dbPath) => {
  const normalized = dbPath.replace(/\\/g, "/");
  return normalized.startsWith("/") ? `file:${normalized}` : `file:///${normalized}`;
};

const resolveTemplateFile = (fileName) => {
  const appPath = app.getAppPath();
  const candidates = [
    path.join(appPath, "prisma", fileName),
    path.join(appPath, "resources", fileName),
    path.join(process.resourcesPath, "app", "prisma", fileName),
    path.join(process.resourcesPath, "app", "resources", fileName),
    path.join(process.resourcesPath, fileName),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
    const base64 = `${candidate}.base64`;
    if (fs.existsSync(base64)) {
      const buffer = Buffer.from(fs.readFileSync(base64, "utf8"), "base64");
      fs.mkdirSync(path.dirname(candidate), { recursive: true });
      fs.writeFileSync(candidate, buffer);
      return candidate;
    }
  }
  return null;
};

function ensurePaths() {
  const baseUserData = app.getPath("userData");
  const userDataPath = path.join(baseUserData, appDirName);
  app.setPath("userData", userDataPath);

  const dbPath = path.join(userDataPath, "data", "app.db");
  const uploadsDir = path.join(userDataPath, "uploads");

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.mkdirSync(uploadsDir, { recursive: true });

  const templateDb = resolveTemplateFile(templateDbName);
  if (!fs.existsSync(dbPath)) {
    if (!templateDb) {
      throw new Error("Template database manjka (prisma/template.db).");
    }
    fs.copyFileSync(templateDb, dbPath);
  }

  const templatePdf = resolveTemplateFile(templatePdfName);
  if (templatePdf) {
    const targetPdf = path.join(uploadsDir, templatePdfName);
    if (!fs.existsSync(targetPdf)) {
      fs.copyFileSync(templatePdf, targetPdf);
    }
    process.env.TEMPLATE_PDF_PATH = templatePdf;
  }

  const dbUrl = normalizeDbUrl(dbPath);

  process.env.USER_DATA_PATH = userDataPath;
  process.env.DATABASE_URL = dbUrl;
  process.env.UPLOADS_DIR = uploadsDir;
  process.env.TEMPLATE_DB_PATH = templateDb || process.env.TEMPLATE_DB_PATH;

  if (isDev) {
    console.log("[electron] userData:", userDataPath);
    console.log("[electron] database URL:", dbUrl);
    console.log("[electron] uploads directory:", uploadsDir);
  }
}

const findAvailablePort = (preferred) =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", (err) => {
      if (preferred && err.code === "EADDRINUSE") {
        server.listen(0, () => {
          const address = server.address();
          const port = typeof address === "object" && address ? address.port : preferred;
          server.close(() => resolve(port));
        });
      } else {
        reject(err);
      }
    });
    server.listen(preferred || 0, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : preferred || 0;
      server.close(() => resolve(port));
    });
  });

async function startProductionServer() {
  if (serverStarted) return `http://localhost:${serverPort}`;

  serverPort = await findAvailablePort(serverPort);

  const standaloneDir = path.join(process.resourcesPath, "app", ".next", "standalone");
  const fallbackDir = path.join(app.getAppPath(), ".next", "standalone");
  const serverPath = fs.existsSync(path.join(standaloneDir, "server.js"))
    ? path.join(standaloneDir, "server.js")
    : path.join(fallbackDir, "server.js");

  if (!fs.existsSync(serverPath)) {
    throw new Error("Manjka Next standalone build. Zaženite `npm run electron:build`.");
  }

  process.chdir(path.dirname(serverPath));
  process.env.PORT = String(serverPort);
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
