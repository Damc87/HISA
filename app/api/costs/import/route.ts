import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const formData = await request.formData();
  const projectId = Number(formData.get("projectId"));
  const file = formData.get("file");

  if (!projectId || !(file instanceof File)) {
    return NextResponse.json({ error: "Manjka projekt ali datoteka" }, { status: 400 });
  }

  const text = await file.text();
  const records = parse(text, { columns: true, skip_empty_lines: true, delimiter: "," });

  const phases = await prisma.phase.findMany({ where: { projectId }, include: { subphases: true } });
  const contractors = await prisma.contractor.findMany({ where: { projectId } });
  const errors: string[] = [];
  let imported = 0;

  for (const [index, row] of records.entries()) {
    try {
      const phase = phases.find((p) => p.name === row.faza);
      const subphase = phase?.subphases.find((s) => s.name === row.podfaza);
      let contractor = contractors.find((c) => c.name === row.izvajalec);
      if (!contractor && row.izvajalec) {
        contractor = await prisma.contractor.create({ data: { name: row.izvajalec, projectId } });
        contractors.push(contractor);
      }

      const kolicina = parseFloat(row.kolicina) || 0;
      const cenaBrezDDV = parseFloat(row.cenaBrezDDV) || 0;
      const ddvStopnja = parseFloat(row.ddvStopnja) || 0;
      const cenaZDDV = kolicina * cenaBrezDDV * (1 + ddvStopnja);

      const tip = (row.tip || "MATERIAL").toString().toUpperCase();
      const status = (row.status || "PLANIRANO").toString().toUpperCase();

      await prisma.costItem.create({
        data: {
          date: row.datum ? new Date(row.datum) : new Date(),
          opis: row.opis,
          projectId,
          phaseId: phase?.id,
          subphaseId: subphase?.id,
          contractorId: contractor?.id,
          kolicina,
          enota: row.enota || "kos",
          cenaBrezDDV,
          ddvStopnja,
          cenaZDDV,
          tip,
          status,
          nacinPlacila: row.nacinPlacila,
          stevilkaRacuna: row.stevilkaRacuna,
          datumRacuna: row.datumRacuna ? new Date(row.datumRacuna) : null,
          datumZapadlosti: row.datumZapadlosti ? new Date(row.datumZapadlosti) : null,
          opombe: row.opombe,
        },
      });
      imported += 1;
    } catch (error: any) {
      errors.push(`Vrstica ${index + 2}: ${error.message || error}`);
    }
  }

  return NextResponse.json({ imported, errors });
}
