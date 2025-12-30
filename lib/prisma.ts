import { pathToFileURL } from "url";
import { PrismaClient } from "@prisma/client";
import { getDatabasePath } from "./paths";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const databasePath = getDatabasePath();
const normalized = databasePath.replace(/\\/g, "/");
const defaultUrl = normalized.startsWith("/") ? `file:${normalized}` : pathToFileURL(databasePath).toString();
const databaseUrl = process.env.DATABASE_URL ?? defaultUrl;
process.env.DATABASE_URL = databaseUrl;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
