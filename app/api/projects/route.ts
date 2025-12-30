import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAppReady } from "@/lib/bootstrap";

export async function GET() {
  await ensureAppReady();
  const projects = await prisma.project.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  await ensureAppReady();
  try {
    const body = await request.json().catch(() => null);
    const { name, description, netoM2, brutoM2, volumenM3, primaryMetric } = body || {};

    if (!name || !String(name).trim()) {
      return NextResponse.json({ status: "error", message: "Ime projekta je obvezno" }, { status: 400 });
    }

    const normalizedPrimaryMetric = primaryMetric ? String(primaryMetric).toUpperCase() : null;
    const allowedMetrics = ["NETO_M2", "BRUTO_M2", "VOLUMEN_M3"];
    const primaryMetricValue = normalizedPrimaryMetric && allowedMetrics.includes(normalizedPrimaryMetric) ? normalizedPrimaryMetric : null;
    const toNumberOrNull = (value: any) => {
      if (value === undefined || value === null || value === "") return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const project = await prisma.project.create({
      data: {
        name: String(name).trim(),
        description: typeof description === "string" ? description.trim() : null,
        netoM2: toNumberOrNull(netoM2),
        brutoM2: toNumberOrNull(brutoM2),
        volumenM3: toNumberOrNull(volumenM3),
        primaryMetric: primaryMetricValue,
      },
    });

    return NextResponse.json({ status: "success", project }, { status: 201 });
  } catch (error: any) {
    const message = error?.message || "Napaka pri ustvarjanju projekta";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
