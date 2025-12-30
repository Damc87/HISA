import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const { phaseId, name } = body;
  if (!phaseId || !name) return NextResponse.json({ error: "Manjka faza ali ime" }, { status: 400 });
  const subphase = await prisma.subphase.create({ data: { name, phaseId } });
  return NextResponse.json({ subphase });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Manjka ID" }, { status: 400 });
  await prisma.subphase.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
