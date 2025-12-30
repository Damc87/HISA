import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { defaultPhases } from "@/lib/constants";
import { ensureAppReady } from "@/lib/bootstrap";

export async function GET() {
  await ensureAppReady();
  const projects = await prisma.project.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  await ensureAppReady();
  const body = await request.json();
  const { name, description, netoM2, brutoM2, volumenM3, primaryMetric } = body;
  if (!name) {
    return NextResponse.json({ error: "Ime projekta je obvezno" }, { status: 400 });
  }

  const normalizedPrimaryMetric = primaryMetric ? String(primaryMetric).toUpperCase() : null;
  const allowedMetrics = ["NETO_M2", "BRUTO_M2", "VOLUMEN_M3"];
  const primaryMetricValue = normalizedPrimaryMetric && allowedMetrics.includes(normalizedPrimaryMetric) ? normalizedPrimaryMetric : null;

  const project = await prisma.project.create({
    data: {
      name,
      description,
      netoM2: netoM2 ? Number(netoM2) : null,
      brutoM2: brutoM2 ? Number(brutoM2) : null,
      volumenM3: volumenM3 ? Number(volumenM3) : null,
      primaryMetric: primaryMetricValue,
    },
  });

  await Promise.all(
    defaultPhases.map((phase, index) =>
      prisma.phase.create({
        data: {
          name: phase.name,
          orderIndex: index,
          projectId: project.id,
          subphases: {
            create: phase.subphases.map((name, idx) => ({ name, orderIndex: idx })),
          },
        },
      })
    )
  );

  return NextResponse.json({ project });
}
