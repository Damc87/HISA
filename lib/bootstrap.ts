import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { CostStatus, CostType, PrimaryMetric } from "@prisma/client";
import { prisma } from "./prisma";
import { defaultPhases } from "./constants";
import { getDatabasePath, getUploadsDir } from "./paths";

let initPromise: Promise<void> | null = null;

export const ensureAppReady = async () => {
  if (!initPromise) {
    initPromise = initialize();
  }
  return initPromise;
};

const initialize = async () => {
  await ensureDatabase();
  await seedIfEmpty();
};

const ensureDatabase = async () => {
  const dbPath = getDatabasePath();
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  try {
    const tables = await prisma.$queryRaw<Array<{ name: string }>>`SELECT name FROM sqlite_master WHERE type='table' AND name='Project'`;
    if (!tables.length) {
      await runPrismaPush(dbPath);
    }
  } catch (error) {
    await runPrismaPush(dbPath);
  }
};

const runPrismaPush = async (dbPath: string) => {
  const env = {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL ?? `file:${dbPath}`,
    PRISMA_CLIENT_ENGINE_TYPE: "binary",
  };

  try {
    execSync("npx prisma db push --skip-generate", {
      stdio: "inherit",
      env,
    });
  } catch (error) {
    await manualSchemaInit();
  }
};

const manualSchemaInit = async () => {
  const statements = [
    `CREATE TABLE IF NOT EXISTS "Project" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "netoM2" REAL,
      "brutoM2" REAL,
      "volumenM3" REAL,
      "primaryMetric" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "Contractor" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "contact" TEXT,
      "email" TEXT,
      "phone" TEXT,
      "projectId" INTEGER NOT NULL,
      FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS "Phase" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "orderIndex" INTEGER NOT NULL DEFAULT 0,
      "projectId" INTEGER NOT NULL,
      FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS "Subphase" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "orderIndex" INTEGER NOT NULL DEFAULT 0,
      "phaseId" INTEGER NOT NULL,
      FOREIGN KEY ("phaseId") REFERENCES "Phase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS "Document" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "filename" TEXT NOT NULL,
      "originalName" TEXT NOT NULL,
      "mimeType" TEXT NOT NULL,
      "size" INTEGER NOT NULL,
      "path" TEXT NOT NULL,
      "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "projectId" INTEGER NOT NULL,
      "contractorId" INTEGER,
      "phaseId" INTEGER,
      FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
      FOREIGN KEY ("phaseId") REFERENCES "Phase" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS "CostItem" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "date" DATETIME NOT NULL,
      "projectId" INTEGER NOT NULL,
      "phaseId" INTEGER,
      "subphaseId" INTEGER,
      "contractorId" INTEGER,
      "opis" TEXT NOT NULL,
      "kolicina" REAL NOT NULL,
      "enota" TEXT NOT NULL,
      "cenaBrezDDV" REAL NOT NULL,
      "ddvStopnja" REAL NOT NULL,
      "cenaZDDV" REAL NOT NULL,
      "tip" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "nacinPlacila" TEXT,
      "stevilkaRacuna" TEXT,
      "datumRacuna" DATETIME,
      "datumZapadlosti" DATETIME,
      "opombe" TEXT,
      "documentId" INTEGER,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      FOREIGN KEY ("phaseId") REFERENCES "Phase" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
      FOREIGN KEY ("subphaseId") REFERENCES "Subphase" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
      FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
      FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    );`,
  ];

  for (const sql of statements) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.$executeRawUnsafe(sql);
  }
};

const seedIfEmpty = async () => {
  const projectCount = await prisma.project.count();
  if (projectCount > 0) return;
  await ensureDemoProject();
};

const ensureDemoProject = async () => {
  const sampleName = "Enodružinska hiša – primer";
  const demoProject =
    (await prisma.project.findFirst({ where: { name: sampleName } })) ||
    (await prisma.project.create({
      data: {
        name: sampleName,
        description: "Vzorčni projekt z vnesenimi stroški",
        netoM2: 165,
        brutoM2: 210,
        volumenM3: 580,
        primaryMetric: PrimaryMetric.NETO_M2,
      },
    }));

  await Promise.all(
    defaultPhases.map(async (phase, phaseIndex) => {
      const existing = await prisma.phase.findFirst({
        where: { projectId: demoProject.id, name: phase.name },
      });

      const phaseRecord =
        existing ??
        (await prisma.phase.create({
          data: {
            name: phase.name,
            orderIndex: phaseIndex,
            projectId: demoProject.id,
          },
        }));

      for (const [subIndex, subName] of phase.subphases.entries()) {
        const subExisting = await prisma.subphase.findFirst({
          where: { phaseId: phaseRecord.id, name: subName },
        });
        if (!subExisting) {
          await prisma.subphase.create({
            data: { name: subName, orderIndex: subIndex, phaseId: phaseRecord.id },
          });
        }
      }
    })
  );

  const contractors = [
    { name: "BetonGrad d.o.o.", contact: "Janez Beton", email: "info@betongrad.si", phone: "+386 41 000 111" },
    { name: "Elektro Mojster", contact: "Maja Elektrika", email: "info@elektro-mojster.si", phone: "+386 31 123 999" },
    { name: "Zeleni vrt", contact: "Luka Vrtar", email: "info@zeleni-vrt.si", phone: "+386 51 222 333" },
    { name: "StrehaPlus", contact: "Rok Krovci", email: "info@streha-plus.si", phone: "+386 31 555 444" },
    { name: "Notranjost Pro", contact: "Sara Interier", email: "info@notranjost-pro.si", phone: "+386 41 888 777" },
    { name: "InstaMont", contact: "Tim Instalater", email: "info@instamont.si", phone: "+386 40 987 654" },
  ];

  const contractorRecords = [];
  for (const contractor of contractors) {
    const existing = await prisma.contractor.findFirst({
      where: { projectId: demoProject.id, name: contractor.name },
    });
    contractorRecords.push(
      existing ??
        (await prisma.contractor.create({
          data: { ...contractor, projectId: demoProject.id },
        }))
    );
  }

  const uploadDir = getUploadsDir();
  const samplePath = path.join(uploadDir, "primer-racun.pdf");
  if (!fs.existsSync(samplePath)) {
    fs.writeFileSync(samplePath, "PDF placeholder za račun");
  }

  const thirdPhase = await prisma.phase.findFirst({ where: { projectId: demoProject.id, orderIndex: 2 }, include: { subphases: true } });
  const installPhase = await prisma.phase.findFirst({ where: { projectId: demoProject.id, name: "Instalacije – groba faza" }, include: { subphases: true } });

  const document = await prisma.document.upsert({
    where: { id: 1 },
    update: {},
    create: {
      filename: "primer-racun.pdf",
      originalName: "Racun-beton.pdf",
      mimeType: "application/pdf",
      size: fs.statSync(samplePath).size,
      path: samplePath,
      projectId: demoProject.id,
      contractorId: contractorRecords[0]?.id,
      phaseId: thirdPhase?.id,
    },
  });

  const sampleCosts = [
    {
      opis: "Beton C25/30 in črpalka za ploščo",
      date: new Date(),
      kolicina: 42,
      enota: "m3",
      cenaBrezDDV: 95,
      ddvStopnja: 0.22,
      tip: CostType.MATERIAL,
      status: CostStatus.PLACANO,
      nacinPlacila: "TRR",
      stevilkaRacuna: "2024-0145",
      datumRacuna: new Date(),
      datumZapadlosti: new Date(),
      opombe: "Črpalka vključena",
      phaseId: thirdPhase?.id,
      subphaseId: thirdPhase?.subphases.find((s) => s.name.includes("Temelj"))?.id,
      contractorId: contractorRecords[0]?.id,
      documentId: document.id,
    },
    {
      opis: "Elektro groba instalacija",
      date: new Date(new Date().setDate(new Date().getDate() - 14)),
      kolicina: 1,
      enota: "kos",
      cenaBrezDDV: 4800,
      ddvStopnja: 0.22,
      tip: CostType.DELO,
      status: CostStatus.POTRJENO,
      nacinPlacila: "TRR",
      stevilkaRacuna: "2024-0088",
      datumRacuna: new Date(),
      datumZapadlosti: new Date(new Date().setDate(new Date().getDate() + 15)),
      opombe: "Vključuje kablovje in omarice",
      phaseId: installPhase?.id,
      subphaseId: installPhase?.subphases.find((s) => s.name.toLowerCase().includes("elektro"))?.id,
      contractorId: contractorRecords[1]?.id,
    },
    {
      opis: "Zunanja ureditev – tlakovanje dovoza",
      date: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      kolicina: 120,
      enota: "m2",
      cenaBrezDDV: 38,
      ddvStopnja: 0.22,
      tip: CostType.DELO,
      status: CostStatus.PLANIRANO,
      nacinPlacila: "Gotovina",
      stevilkaRacuna: null,
      datumRacuna: null,
      datumZapadlosti: null,
      opombe: "Potrebna potrditev investitorja",
      phaseId: (await prisma.phase.findFirst({ where: { projectId: demoProject.id, name: "Okolica in zunanja ureditev" } }))?.id,
      contractorId: contractorRecords[2]?.id,
    },
    {
      opis: "Toplotna izolacija fasade",
      date: new Date(new Date().setMonth(new Date().getMonth() - 2)),
      kolicina: 250,
      enota: "m2",
      cenaBrezDDV: 32,
      ddvStopnja: 0.22,
      tip: CostType.MATERIAL,
      status: CostStatus.PLACANO,
      nacinPlacila: "TRR",
      stevilkaRacuna: "2024-101",
      datumRacuna: new Date(new Date().setMonth(new Date().getMonth() - 2)),
      datumZapadlosti: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      opombe: "5 cm grafitni EPS",
      phaseId: (await prisma.phase.findFirst({ where: { projectId: demoProject.id, name: "Fasada in toplotni ovoj" } }))?.id,
      contractorId: contractorRecords[0]?.id,
    },
  ];

  for (const cost of sampleCosts) {
    const exists = await prisma.costItem.findFirst({
      where: { projectId: demoProject.id, opis: cost.opis },
    });
    if (!exists) {
      const cenaZDDV = cost.kolicina * cost.cenaBrezDDV * (1 + cost.ddvStopnja);
      await prisma.costItem.create({
        data: {
          ...cost,
          cenaZDDV,
          projectId: demoProject.id,
        },
      });
    }
  }

  return demoProject;
};

export const seedDemoData = async () => ensureDemoProject();

export const getHealth = async () => {
  await ensureAppReady();
  const [projects, phases, contractors] = await Promise.all([
    prisma.project.count(),
    prisma.phase.count(),
    prisma.contractor.count(),
  ]);

  return {
    server: "ok",
    db: "ok",
    counts: { projects, phases, contractors },
  };
};
