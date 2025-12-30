import { NextResponse } from "next/server";
import { ensureAppReady, seedDemoData } from "@/lib/bootstrap";
import { prisma } from "@/lib/prisma";

export async function POST() {
  await ensureAppReady();
  const project = await seedDemoData();
  const projects = await prisma.project.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ project, projects });
}
