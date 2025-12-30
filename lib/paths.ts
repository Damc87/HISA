import fs from "fs";
import os from "os";
import path from "path";

const appDirName = "gradnja-stroski";

const getDefaultUserDataPath = () => {
  switch (process.platform) {
    case "win32": {
      const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
      return path.join(appData, appDirName);
    }
    case "darwin":
      return path.join(os.homedir(), "Library", "Application Support", appDirName);
    default:
      return path.join(os.homedir(), ".config", appDirName);
  }
};

export const getUserDataPath = () => {
  const fallback = getDefaultUserDataPath();
  const target = process.env.USER_DATA_PATH || fallback;
  fs.mkdirSync(target, { recursive: true });
  process.env.USER_DATA_PATH = target;
  return target;
};

export const getDatabasePath = () => {
  const userDataPath = getUserDataPath();
  const dbPath = path.join(userDataPath, "data", "app.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  return dbPath;
};

export const getUploadsDir = () => {
  const userDataPath = getUserDataPath();
  const uploadsDir = path.join(userDataPath, "uploads");
  fs.mkdirSync(uploadsDir, { recursive: true });
  process.env.UPLOADS_DIR = uploadsDir;
  return uploadsDir;
};
