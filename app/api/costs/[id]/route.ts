import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAppReady } from "@/lib/bootstrap";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  await ensureAppReady();
  const body = await request.json();
  const id = Number(params.id);
  const {
    date,
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

  const k = Number(kolicina) || 0;
  const cena = Number(cenaBrezDDV) || 0;
  const ddv = Number(ddvStopnja) || 0;
  const cenaZDDV = k * cena * (1 + ddv);

  const cost = await prisma.costItem.update({
    where: { id },
    data: {
      date: new Date(date),
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

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await ensureAppReady();
  await prisma.costItem.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
