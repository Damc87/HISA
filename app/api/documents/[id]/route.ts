import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const document = await prisma.document.findUnique({ where: { id: Number(params.id) } });
  if (!document) return NextResponse.json({ error: "Ni dokumenta" }, { status: 404 });

  const filePath = path.isAbsolute(document.path)
    ? document.path
    : path.join(process.cwd(), document.path);
  try {
    const file = await fs.readFile(filePath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": document.mimeType || "application/pdf",
        "Content-Disposition": `inline; filename=${document.originalName}`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Datoteka ni dosegljiva" }, { status: 500 });
  }
}
