import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAppReady } from "@/lib/bootstrap";

export async function GET(request: Request) {
  await ensureAppReady();
  const { searchParams } = new URL(request.url);
  const projectId = Number(searchParams.get("projectId"));
  if (!projectId) {
    return NextResponse.json({ error: "projectId je obvezen" }, { status: 400 });
  }

  const where: any = { projectId };
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) where.date.lte = new Date(dateTo);
  }
  const phaseId = searchParams.get("phaseId");
  const contractorId = searchParams.get("contractorId");
  const status = searchParams.get("status")?.toUpperCase();
  const tip = searchParams.get("tip")?.toUpperCase();
  const search = searchParams.get("search");

  if (phaseId) where.phaseId = Number(phaseId);
  if (contractorId) where.contractorId = Number(contractorId);
  if (status) where.status = status;
  if (tip) where.tip = tip;
  if (search) {
    where.OR = [
      { opis: { contains: search, mode: "insensitive" } },
      { stevilkaRacuna: { contains: search, mode: "insensitive" } },
    ];
  }

  const costs = await prisma.costItem.findMany({
    where,
    orderBy: { date: "desc" },
    include: { phase: true, subphase: true, contractor: true, document: true },
  });

  return NextResponse.json({ costs });
}

export async function POST(request: Request) {
  await ensureAppReady();
  const body = await request.json();
  const {
    date,
    projectId,
    phaseId,
    subphaseId,
    contractorId,
    opis,
    kolicina,
    enota,
    cenaBrezDDV,
    ddvStopnja,
    tip,
    status,
    nacinPlacila,
    stevilkaRacuna,
    datumRacuna,
    datumZapadlosti,
    opombe,
    documentId,
  } = body;

  if (!projectId || !date || !opis) {
    return NextResponse.json({ error: "Datum, opis in projekt so obvezni" }, { status: 400 });
  }

  const k = Number(kolicina) || 0;
  const cena = Number(cenaBrezDDV) || 0;
  const ddv = Number(ddvStopnja) || 0;
  const cenaZDDV = k * cena * (1 + ddv);

  const cost = await prisma.costItem.create({
    data: {
      date: new Date(date),
      projectId,
      phaseId: phaseId ? Number(phaseId) : null,
      subphaseId: subphaseId ? Number(subphaseId) : null,
      contractorId: contractorId ? Number(contractorId) : null,
      opis,
      kolicina: k,
      enota,
      cenaBrezDDV: cena,
      ddvStopnja: ddv,
      cenaZDDV,
      tip: (tip || "MATERIAL").toString().toUpperCase(),
      status: (status || "PLANIRANO").toString().toUpperCase(),
      nacinPlacila,
      stevilkaRacuna,
      datumRacuna: datumRacuna ? new Date(datumRacuna) : null,
      datumZapadlosti: datumZapadlosti ? new Date(datumZapadlosti) : null,
      opombe,
      documentId: documentId ? Number(documentId) : null,
    },
  });

  return NextResponse.json({ cost });
}
