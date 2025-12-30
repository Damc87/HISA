import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAppReady } from "@/lib/bootstrap";

export async function GET(request: Request) {
  await ensureAppReady();
  const { searchParams } = new URL(request.url);
  const projectId = Number(searchParams.get("projectId"));
  const phases = await prisma.phase.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { orderIndex: "asc" },
    include: { subphases: { orderBy: { orderIndex: "asc" } } },
  });
  return NextResponse.json({ phases });
}

export async function POST(request: Request) {
  await ensureAppReady();
  const body = await request.json();
  const { name, projectId, subphases } = body;
  if (!name || !projectId) {
    return NextResponse.json({ error: "Manjka ime ali projekt" }, { status: 400 });
  }
  const phase = await prisma.phase.create({
    data: {
      name,
      projectId,
      subphases: {
        create: (subphases || []).map((name: string, idx: number) => ({ name, orderIndex: idx })),
      },
    },
    include: { subphases: true },
  });
  return NextResponse.json({ phase });
}

export async function PUT(request: Request) {
  await ensureAppReady();
  const body = await request.json();
  const { id, name } = body;
  if (!id) {
    return NextResponse.json({ error: "Manjka ID" }, { status: 400 });
  }
  const phase = await prisma.phase.update({ where: { id }, data: { name } });
  return NextResponse.json({ phase });
}

export async function PATCH(request: Request) {
  await ensureAppReady();
  const body = await request.json();
  const { phases } = body;
  if (!Array.isArray(phases)) {
    return NextResponse.json({ error: "Manjka seznam faz" }, { status: 400 });
  }
  const updates = phases.map((phase: any, index: number) =>
    prisma.phase.update({ where: { id: Number(phase.id) }, data: { orderIndex: phase.orderIndex ?? index } })
  );
  await prisma.$transaction(updates);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  await ensureAppReady();
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Manjka ID" }, { status: 400 });
  await prisma.costItem.updateMany({ where: { phaseId: id }, data: { phaseId: null, subphaseId: null } });
  await prisma.subphase.deleteMany({ where: { phaseId: id } });
  await prisma.phase.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
