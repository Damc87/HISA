import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAppReady } from "@/lib/bootstrap";

export async function GET(request: Request) {
  await ensureAppReady();
  const { searchParams } = new URL(request.url);
  const projectId = Number(searchParams.get("projectId"));
  if (!projectId) return NextResponse.json({ error: "projectId je obvezen" }, { status: 400 });

  const [costs, phases, contractors, project] = await Promise.all([
    prisma.costItem.findMany({ where: { projectId }, orderBy: { date: "asc" } }),
    prisma.phase.findMany({ where: { projectId } }),
    prisma.contractor.findMany({ where: { projectId } }),
    prisma.project.findUnique({ where: { id: projectId } }),
  ]);

  const total = costs.reduce((sum, c) => sum + c.cenaZDDV, 0);
  const paid = costs.filter((c) => c.status === "PLACANO").reduce((sum, c) => sum + c.cenaZDDV, 0);
  const unpaid = total - paid;
  const now = new Date();
  const monthCosts = costs.filter((c) => c.date.getMonth() === now.getMonth() && c.date.getFullYear() === now.getFullYear());
  const monthTotal = monthCosts.reduce((sum, c) => sum + c.cenaZDDV, 0);

  const byPhase = phases.map((phase) => ({
    name: phase.name,
    total: costs.filter((c) => c.phaseId === phase.id).reduce((s, c) => s + c.cenaZDDV, 0),
  }));

  const byContractor = contractors.map((c) => ({
    name: c.name,
    total: costs.filter((cost) => cost.contractorId === c.id).reduce((s, cost) => s + cost.cenaZDDV, 0),
  }));

  const byType = costs.reduce<Record<string, number>>((acc, cost) => {
    acc[cost.tip] = (acc[cost.tip] || 0) + cost.cenaZDDV;
    return acc;
  }, {});

  const cumulative: { date: string; total: number }[] = [];
  let running = 0;
  costs.forEach((cost) => {
    running += cost.cenaZDDV;
    cumulative.push({ date: cost.date.toISOString(), total: running });
  });

  const overdue = costs.filter(
    (c) => c.status !== "PLACANO" && c.datumZapadlosti && c.datumZapadlosti < new Date()
  );

  const perM2 = project?.netoM2 ? total / project.netoM2 : null;
  const perM3 = project?.volumenM3 ? total / project.volumenM3 : null;

  return NextResponse.json({
    total,
    byPhase,
    byContractor,
    byType,
    cumulative,
    overdue,
    perM2,
    perM3,
    project,
    totals: {
      paid,
      unpaid,
      thisMonth: monthTotal,
      invoices: costs.length,
    },
  });
}
