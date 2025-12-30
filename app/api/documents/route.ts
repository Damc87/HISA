import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAppReady } from "@/lib/bootstrap";

export async function GET(request: Request) {
  await ensureAppReady();
  const { searchParams } = new URL(request.url);
  const projectId = Number(searchParams.get("projectId"));
  const phaseId = Number(searchParams.get("phaseId") || "");
  const contractorId = Number(searchParams.get("contractorId") || "");

  const where: any = {};
  if (projectId) where.projectId = projectId;
  if (phaseId) where.phaseId = phaseId;
  if (contractorId) where.contractorId = contractorId;

  const documents = await prisma.document.findMany({
    where,
    orderBy: { uploadedAt: "desc" },
    include: { costItems: true, contractor: true, phase: true },
  });

  return NextResponse.json({ documents });
}
