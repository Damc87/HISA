import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAppReady } from "@/lib/bootstrap";

export async function POST(request: Request) {
  await ensureAppReady();
  const body = await request.json();
  const { phaseId, name } = body;
  if (!phaseId || !name) return NextResponse.json({ error: "Manjka faza ali ime" }, { status: 400 });
  const subphase = await prisma.subphase.create({ data: { name, phaseId } });
  return NextResponse.json({ subphase });
}

export async function PUT(request: Request) {
  await ensureAppReady();
  const body = await request.json();
  const { id, name, orderIndex } = body;
  if (!id) return NextResponse.json({ error: "Manjka ID" }, { status: 400 });
  const subphase = await prisma.subphase.update({
    where: { id },
    data: { name, orderIndex },
  });
  return NextResponse.json({ subphase });
}

export async function DELETE(request: Request) {
  await ensureAppReady();
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Manjka ID" }, { status: 400 });
  await prisma.costItem.updateMany({ where: { subphaseId: id }, data: { subphaseId: null } });
  await prisma.subphase.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
