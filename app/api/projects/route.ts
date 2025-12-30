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
  const { name, description } = body;
  if (!name) {
    return NextResponse.json({ error: "Ime projekta je obvezno" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: { name, description },
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
