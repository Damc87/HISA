import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAppReady } from "@/lib/bootstrap";

export async function GET(request: Request) {
  await ensureAppReady();
  const { searchParams } = new URL(request.url);
  const projectId = Number(searchParams.get("projectId"));
  const contractors = await prisma.contractor.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ contractors });
}

export async function POST(request: Request) {
  await ensureAppReady();
  const body = await request.json();
  const { name, contact, email, phone, projectId } = body;
  if (!name || !projectId) {
    return NextResponse.json({ error: "Manjka ime ali projekt" }, { status: 400 });
  }
  const contractor = await prisma.contractor.create({
    data: { name, contact, email, phone, projectId },
  });
  return NextResponse.json({ contractor });
}
