import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAppReady } from "@/lib/bootstrap";

function toCsvValue(value: any) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: Request) {
  await ensureAppReady();
  const { searchParams } = new URL(request.url);
  const projectId = Number(searchParams.get("projectId"));
  if (!projectId) return NextResponse.json({ error: "projectId je obvezen" }, { status: 400 });

  const costs = await prisma.costItem.findMany({
    where: { projectId },
    include: { phase: true, subphase: true, contractor: true },
    orderBy: { date: "asc" },
  });

  const header = [
    "datum",
    "opis",
    "kolicina",
    "enota",
    "cenaBrezDDV",
    "ddvStopnja",
    "cenaZDDV",
    "tip",
    "status",
    "faza",
    "podfaza",
    "izvajalec",
    "nacinPlacila",
    "stevilkaRacuna",
    "datumRacuna",
    "datumZapadlosti",
    "opombe",
  ];

  const rows = costs.map((c) => [
    c.date.toISOString(),
    c.opis,
    c.kolicina,
    c.enota,
    c.cenaBrezDDV,
    c.ddvStopnja,
    c.cenaZDDV,
    c.tip,
    c.status,
    c.phase?.name ?? "",
    c.subphase?.name ?? "",
    c.contractor?.name ?? "",
    c.nacinPlacila ?? "",
    c.stevilkaRacuna ?? "",
    c.datumRacuna?.toISOString() ?? "",
    c.datumZapadlosti?.toISOString() ?? "",
    c.opombe ?? "",
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((value) => toCsvValue(value)).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=stroski.csv",
    },
  });
}
