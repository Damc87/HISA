import { PrismaClient, CostStatus, CostType, PrimaryMetric } from "@prisma/client";
import fs from "fs";
import path from "path";
import { defaultPhases } from "../lib/constants";

const prisma = new PrismaClient();

async function main() {
  await prisma.costItem.deleteMany();
  await prisma.document.deleteMany();
  await prisma.subphase.deleteMany();
  await prisma.phase.deleteMany();
  await prisma.contractor.deleteMany();
  await prisma.project.deleteMany();

  const project = await prisma.project.create({
    data: {
      name: "Enodružinska hiša – primer",
      description: "Vzorčni projekt z vnesenimi stroški",
      netoM2: 165,
      brutoM2: 210,
      volumenM3: 580,
      primaryMetric: PrimaryMetric.NETO_M2,
    },
  });

  const secondProject = await prisma.project.create({
    data: {
      name: "Moderna hiša z ravno streho",
      description: "Prazna baza za vnos novih stroškov",
      netoM2: 140,
      brutoM2: 190,
      volumenM3: 500,
      primaryMetric: PrimaryMetric.BRUTO_M2,
    },
  });

  const phases = [] as { id: number; name: string }[];
  for (const [index, phase] of defaultPhases.entries()) {
    const created = await prisma.phase.create({
      data: {
        name: phase.name,
        orderIndex: index,
        projectId: project.id,
        subphases: {
          create: phase.subphases.map((name, idx) => ({ name, orderIndex: idx })),
        },
      },
      include: { subphases: true },
    });
    phases.push({ id: created.id, name: created.name });
  }

  // minimal phases for second project
  for (const [index, phase] of defaultPhases.slice(0, 4).entries()) {
    await prisma.phase.create({
      data: {
        name: phase.name,
        orderIndex: index,
        projectId: secondProject.id,
        subphases: { create: phase.subphases.map((name, idx) => ({ name, orderIndex: idx })) },
      },
    });
  }

  const contractors = await prisma.$transaction([
    prisma.contractor.create({
      data: { name: "BetonGrad d.o.o.", contact: "Janez Beton", email: "info@betongrad.si", phone: "+386 41 000 111", projectId: project.id },
    }),
    prisma.contractor.create({
      data: { name: "Elektro Mojster", contact: "Maja Elektrika", email: "info@elektro-mojster.si", phone: "+386 31 123 999", projectId: project.id },
    }),
    prisma.contractor.create({
      data: { name: "Zeleni vrt", contact: "Luka Vrtar", email: "info@zeleni-vrt.si", phone: "+386 51 222 333", projectId: project.id },
    }),
  ]);

  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const samplePath = path.join(uploadsDir, "primer-racun.pdf");
  if (!fs.existsSync(samplePath)) {
    fs.writeFileSync(samplePath, "PDF placeholder za račun");
  }

  const document = await prisma.document.create({
    data: {
      filename: "primer-racun.pdf",
      originalName: "Racun-beton.pdf",
      mimeType: "application/pdf",
      size: fs.statSync(samplePath).size,
      path: samplePath,
      projectId: project.id,
      contractorId: contractors[0].id,
      phaseId: phases[2].id,
    },
  });

  const [temeljenjeSubphase, instalacijeSubphase] = await Promise.all([
    prisma.subphase.findFirst({
      where: {
        phase: { projectId: project.id, name: defaultPhases[2].name },
        name: { contains: "Temelj" },
      },
    }),
    prisma.subphase.findFirst({
      where: {
        phase: { projectId: project.id, name: defaultPhases[6].name },
        name: { contains: "Elektro" },
      },
    }),
  ]);

  const costItemsData = [
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
      phaseId: phases[2].id,
      subphaseId: temeljenjeSubphase?.id,
      contractorId: contractors[0].id,
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
      phaseId: phases[6].id,
      subphaseId: instalacijeSubphase?.id,
      contractorId: contractors[1].id,
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
      phaseId: phases[11].id,
      subphaseId: null,
      contractorId: contractors[2].id,
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
      phaseId: phases[8].id,
      subphaseId: null,
      contractorId: contractors[0].id,
    },
  ];

  for (const item of costItemsData) {
    const cenaZDDV = item.cenaBrezDDV * (1 + item.ddvStopnja) * item.kolicina;
    await prisma.costItem.create({
      data: {
        ...item,
        projectId: project.id,
        cenaZDDV,
      },
    });
  }

  console.log("Seed končan");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
