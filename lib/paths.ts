import fs from "fs";
import os from "os";
import path from "path";

export const getUserDataPath = () => {
  if (process.env.USER_DATA_PATH) return process.env.USER_DATA_PATH;
  const fallback = path.join(os.homedir(), ".gradnja-stroski");
  fs.mkdirSync(fallback, { recursive: true });
  process.env.USER_DATA_PATH = fallback;
  return fallback;
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
