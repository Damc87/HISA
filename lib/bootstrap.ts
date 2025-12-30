import path from "path";
import fs from "fs";
import { CostStatus, CostType, PrimaryMetric } from "@prisma/client";
import { prisma } from "./prisma";
import { defaultPhases } from "./constants";
import { getDatabasePath, getUploadsDir, getUserDataPath } from "./paths";

let initPromise: Promise<void> | null = null;
const templateDbName = "template.db";
const templatePdfName = "primer-racun.pdf";

export const ensureAppReady = async () => {
  if (!initPromise) {
    initPromise = initialize();
  }
  return initPromise;
};

const initialize = async () => {
  await ensureDatabase();
  await seedIfEmpty();
  await ensureTemplateUpload();
};

const normalizeDbUrl = (dbPath: string) => {
  const normalized = dbPath.replace(/\\/g, "/");
  return normalized.startsWith("/") ? `file:${normalized}` : `file:///${normalized}`;
};

const resolvePathFromCandidates = (candidates: Array<string | undefined>) => {
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  return null;
};

const materializeBase64File = (base64Path: string, targetPath: string) => {
  const raw = fs.readFileSync(base64Path, "utf8");
  const buffer = Buffer.from(raw, "base64");
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, buffer);
  return targetPath;
};

const resolveTemplateDbPath = () => {
  const appRoot = process.cwd();
  const resourcesPath = (process as any).resourcesPath as string | undefined;
  const pairs = [
    { bin: process.env.TEMPLATE_DB_PATH, base64: process.env.TEMPLATE_DB_PATH ? `${process.env.TEMPLATE_DB_PATH}.base64` : undefined },
    { bin: path.join(appRoot, "prisma", templateDbName), base64: path.join(appRoot, "prisma", `${templateDbName}.base64`) },
    { bin: path.join(appRoot, "resources", templateDbName), base64: path.join(appRoot, "resources", `${templateDbName}.base64`) },
    { bin: path.join(appRoot, "..", "prisma", templateDbName), base64: path.join(appRoot, "..", "prisma", `${templateDbName}.base64`) },
    { bin: path.join(appRoot, "..", "resources", templateDbName), base64: path.join(appRoot, "..", "resources", `${templateDbName}.base64`) },
    resourcesPath
      ? { bin: path.join(resourcesPath, "app", "prisma", templateDbName), base64: path.join(resourcesPath, "app", "prisma", `${templateDbName}.base64`) }
      : null,
    resourcesPath
      ? { bin: path.join(resourcesPath, templateDbName), base64: path.join(resourcesPath, `${templateDbName}.base64`) }
      : null,
  ].filter(Boolean) as Array<{ bin?: string; base64?: string }>;

  for (const { bin, base64 } of pairs) {
    if (bin && fs.existsSync(bin)) return bin;
    if (base64 && fs.existsSync(base64)) {
      const target = bin ?? base64.replace(/\.base64$/, "");
      return materializeBase64File(base64, target);
    }
  }
  throw new Error("Template database ni najdena (manjka prisma/template.db.base64)");
};

const resolveTemplatePdfPath = () => {
  const appRoot = process.cwd();
  const resourcesPath = (process as any).resourcesPath as string | undefined;
  const pairs = [
    { bin: process.env.TEMPLATE_PDF_PATH, base64: process.env.TEMPLATE_PDF_PATH ? `${process.env.TEMPLATE_PDF_PATH}.base64` : undefined },
    { bin: path.join(appRoot, "resources", templatePdfName), base64: path.join(appRoot, "resources", `${templatePdfName}.base64`) },
    { bin: path.join(appRoot, "..", "resources", templatePdfName), base64: path.join(appRoot, "..", "resources", `${templatePdfName}.base64`) },
    resourcesPath
      ? { bin: path.join(resourcesPath, "app", "resources", templatePdfName), base64: path.join(resourcesPath, "app", "resources", `${templatePdfName}.base64`) }
      : null,
    resourcesPath ? { bin: path.join(resourcesPath, templatePdfName), base64: path.join(resourcesPath, `${templatePdfName}.base64`) } : null,
  ].filter(Boolean) as Array<{ bin?: string; base64?: string }>;

  for (const { bin, base64 } of pairs) {
    if (bin && fs.existsSync(bin)) return bin;
    if (base64 && fs.existsSync(base64)) {
      const target = bin ?? base64.replace(/\.base64$/, "");
      return materializeBase64File(base64, target);
    }
  }
  return null;
};

const ensureDatabase = async () => {
  const dbPath = getDatabasePath();
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  process.env.USER_DATA_PATH = getUserDataPath();
  process.env.DATABASE_URL = normalizeDbUrl(dbPath);
  process.env.UPLOADS_DIR = getUploadsDir();

  const templatePath = resolveTemplateDbPath();
  if (!fs.existsSync(dbPath)) {
    fs.copyFileSync(templatePath, dbPath);
    return;
  }

  const hasTable = await hasProjectTable();
  if (!hasTable) {
    await prisma.$disconnect();
    fs.copyFileSync(templatePath, dbPath);
    await prisma.$connect();
  }
};

const hasProjectTable = async () => {
  try {
    const tables = await prisma.$queryRaw<Array<{ name: string }>>`SELECT name FROM sqlite_master WHERE type='table' AND name='Project'`;
    return tables.length > 0;
  } catch (error) {
    return false;
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

const ensureTemplateUpload = async () => {
  const uploadsDir = getUploadsDir();
  const templatePdf = resolveTemplatePdfPath();
  if (!templatePdf) return;

  const target = path.join(uploadsDir, templatePdfName);
  if (!fs.existsSync(target)) {
    fs.copyFileSync(templatePdf, target);
  }
};

export const seedDemoData = async () => ensureDemoProject();

export const getHealth = async () => {
  await ensureAppReady();
  const [projects, phases, contractors] = await Promise.all([
    prisma.project.count(),
    prisma.phase.count(),
    prisma.contractor.count(),
  ]);

  const dbPath = getDatabasePath();
  const uploadsDir = getUploadsDir();

  const response: any = {
    server: "ok",
    db: "ok",
    counts: { projects, phases, contractors },
  };

  if (process.env.NODE_ENV !== "production") {
    response.paths = {
      databaseUrl: process.env.DATABASE_URL,
      dbPath,
      uploadsDir,
    };
  }

  return response;
};
