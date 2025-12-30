import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAppReady } from "@/lib/bootstrap";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  await ensureAppReady();
  const projectId = Number(params.id);
  const body = await request.json();
  const { netoM2, brutoM2, volumenM3, primaryMetric, name, description } = body;

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      netoM2,
      brutoM2,
      volumenM3,
      primaryMetric,
      name,
      description,
    },
  });

  return NextResponse.json({ project });
}
