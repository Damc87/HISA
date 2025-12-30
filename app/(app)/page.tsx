"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { useProjectContext } from "@/components/project-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { NoProjectState } from "@/components/no-project";

const COLORS = ["#2563eb", "#22c55e", "#a855f7", "#f97316", "#e11d48", "#0ea5e9"];

export default function DashboardPage() {
  const { selectedProjectId, projects } = useProjectContext();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      if (!selectedProjectId) return;
      setLoading(true);
      const res = await fetch(`/api/dashboard?projectId=${selectedProjectId}`);
      const json = await res.json();
      setData(json);
      setLoading(false);
    };
    load();
  }, [selectedProjectId]);

  const project = projects.find((p) => p.id === selectedProjectId);

  const exportPdf = () => {
    if (!selectedProjectId) return;
    window.open(`/api/reports/phases?projectId=${selectedProjectId}`, "_blank");
  };

  if (!selectedProjectId) {
    return <NoProjectState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Pregled projekta</p>
          <h1 className="text-2xl font-semibold">{project?.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          {project?.description && <Badge className="bg-blue-100 text-blue-800">{project.description}</Badge>}
          <Button onClick={exportPdf} className="gap-2" variant="outline">
            <Download className="h-4 w-4" /> PDF poročilo po fazah
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { title: "Skupni stroški", value: data?.total ? formatCurrency(data.total) : "–", sub: "Vključeni vsi stroški" },
          { title: "Neplačano", value: data?.totals ? formatCurrency(data.totals.unpaid) : "–", sub: "Še odprti zneski" },
          { title: "Plačano", value: data?.totals ? formatCurrency(data.totals.paid) : "–", sub: "Stroški s statusom plačano" },
          { title: "Ta mesec", value: data?.totals ? formatCurrency(data.totals.thisMonth) : "–", sub: "Tokovi za aktualni mesec" },
          { title: "Št. računov", value: data?.totals ? data.totals.invoices : "0", sub: "Vsi vnosi stroškov" },
        ].map((card) => (
          <Card key={card.title} className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{loading ? "…" : card.value}</p>
              <p className="text-sm text-slate-500">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="h-[360px]">
          <CardHeader>
            <CardTitle>Stroški po fazah</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.byPhase || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} height={60} interval={0} angle={-10} textAnchor="end" />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="h-[360px]">
          <CardHeader>
            <CardTitle>Struktura po tipu stroška</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={Object.entries(data?.byType || {}).map(([name, value]) => ({ name, value }))} dataKey="value" nameKey="name" outerRadius={100}>
                  {Object.keys(data?.byType || {}).map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="h-[360px]">
          <CardHeader>
            <CardTitle>Kumulativa skozi čas</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.cumulative || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => formatDate(value)} />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip labelFormatter={(value) => formatDate(value)} formatter={(value: number) => formatCurrency(value)} />
                <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="h-[360px]">
          <CardHeader>
            <CardTitle>Stroški po izvajalcih</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.byContractor || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} height={60} interval={0} angle={-10} textAnchor="end" />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="total" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {data?.overdue?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Neplačani stroški po zapadlosti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.overdue.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-semibold">{item.opis}</p>
                    <p className="text-slate-500">Zapadlost: {formatDate(item.datumZapadlosti)}</p>
                  </div>
                  <Badge className="bg-red-100 text-red-700">{formatCurrency(item.cenaZDDV)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {loading && <div className="text-sm text-slate-500">Nalaganje podatkov ...</div>}
    </div>
  );
}
