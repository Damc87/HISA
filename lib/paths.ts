import fs from "fs";
import path from "path";

export const getUserDataPath = () => process.env.USER_DATA_PATH || "";

export const getDatabasePath = () => {
  const userDataPath = getUserDataPath();
  if (userDataPath) {
    const dbPath = path.join(userDataPath, "data", "app.db");
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    return dbPath;
  }
  return path.join(process.cwd(), "prisma", "dev.db");
};

export const getUploadsDir = () => {
  const userDataPath = getUserDataPath();
  const uploadsDir = userDataPath ? path.join(userDataPath, "uploads") : path.join(process.cwd(), "uploads");
  fs.mkdirSync(uploadsDir, { recursive: true });
  return uploadsDir;
};
