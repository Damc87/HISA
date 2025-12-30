import PDFDocument from "pdfkit";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { sl } from "date-fns/locale";
import { ensureAppReady } from "@/lib/bootstrap";

export async function GET(request: Request) {
  await ensureAppReady();
  const { searchParams } = new URL(request.url);
  const projectId = Number(searchParams.get("projectId"));
  if (!projectId) return NextResponse.json({ error: "projectId je obvezen" }, { status: 400 });

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  const phases = await prisma.phase.findMany({
    where: { projectId },
    include: { costs: true },
    orderBy: { orderIndex: "asc" },
  });

  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  doc.fontSize(18).text(`Poročilo po fazah – ${project?.name}`, { align: "left" });
  doc.moveDown();
  doc.fontSize(12).text(`Datum izvoza: ${format(new Date(), "d. MMM yyyy", { locale: sl })}`);
  doc.moveDown();

  let grandTotal = 0;
  phases.forEach((phase) => {
    const total = phase.costs.reduce((acc, item) => acc + item.cenaZDDV, 0);
    grandTotal += total;
    doc.fontSize(14).text(phase.name);
    doc.fontSize(11).fillColor("#475569").text(`Skupaj: ${total.toFixed(2)} EUR`, { indent: 12 });
    doc.moveDown(0.5);
  });

  doc.moveDown();
  doc.fillColor("#0f172a").fontSize(12);
  doc.text(`Skupni strošek: ${grandTotal.toFixed(2)} EUR`);
  if (project?.netoM2) {
    doc.text(`Skupaj €/m2 (neto): ${(grandTotal / project.netoM2).toFixed(2)} EUR/m2`);
  }
  if (project?.volumenM3) {
    doc.text(`Skupaj €/m3: ${(grandTotal / project.volumenM3).toFixed(2)} EUR/m3`);
  }

  doc.end();
  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    const finish = () => resolve(Buffer.concat(chunks));
    doc.on("end", finish);
  });

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=porocilo-faze.pdf",
    },
  });
}
