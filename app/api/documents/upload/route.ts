import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getUploadsDir } from "@/lib/paths";
import { ensureAppReady } from "@/lib/bootstrap";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await ensureAppReady();
  const formData = await request.formData();
  const file = formData.get("file");
  const projectId = Number(formData.get("projectId"));
  const contractorId = formData.get("contractorId") ? Number(formData.get("contractorId")) : undefined;
  const phaseId = formData.get("phaseId") ? Number(formData.get("phaseId")) : undefined;
  const costItemId = formData.get("costItemId") ? Number(formData.get("costItemId")) : undefined;

  if (!(file instanceof File) || !projectId) {
    return NextResponse.json({ error: "Napačen vnos" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uploadDir = getUploadsDir();
  const safeName = file.name.replace(/\s+/g, "-");
  const filename = `${Date.now()}-${safeName}`;
  const filepath = path.join(uploadDir, filename);
  await fs.writeFile(filepath, buffer);

  const document = await prisma.document.create({
    data: {
      filename,
      originalName: file.name,
      mimeType: file.type || "application/pdf",
      size: buffer.length,
      path: filepath,
      projectId,
      contractorId,
      phaseId,
    },
  });

  if (costItemId) {
    await prisma.costItem.update({
      where: { id: costItemId },
      data: { documentId: document.id },
    });
  }

  return NextResponse.json({ document: { ...document, costItemId } });
}
