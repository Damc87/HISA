import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
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
  const body = await request.json();
  const { id, name } = body;
  if (!id) {
    return NextResponse.json({ error: "Manjka ID" }, { status: 400 });
  }
  const phase = await prisma.phase.update({ where: { id }, data: { name } });
  return NextResponse.json({ phase });
}
