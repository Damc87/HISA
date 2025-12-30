"use client";

import { useEffect, useState } from "react";
import { useProjectContext } from "@/components/project-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { NoProjectState } from "@/components/no-project";

export default function SettingsPage() {
  const { selectedProjectId, refresh } = useProjectContext();
  const [form, setForm] = useState({
    name: "",
    description: "",
    netoM2: "",
    brutoM2: "",
    volumenM3: "",
    primaryMetric: "NETO_M2",
  });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  const load = async () => {
    if (!selectedProjectId) return;
    const res = await fetch(`/api/projects`);
    const json = await res.json();
    const project = (json.projects || []).find((p: any) => p.id === selectedProjectId);
    if (project) {
      setForm({
        name: project.name,
        description: project.description || "",
        netoM2: project.netoM2 || "",
        brutoM2: project.brutoM2 || "",
        volumenM3: project.volumenM3 || "",
        primaryMetric: project.primaryMetric || "NETO_M2",
      });
    }
  };

  const save = async () => {
    if (!selectedProjectId) return;
    await fetch(`/api/projects/${selectedProjectId}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        netoM2: form.netoM2 ? Number(form.netoM2) : null,
        brutoM2: form.brutoM2 ? Number(form.brutoM2) : null,
        volumenM3: form.volumenM3 ? Number(form.volumenM3) : null,
      }),
    });
    refresh();
  };

  if (!selectedProjectId) {
    return <NoProjectState />;
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-500">Osnovni parametri projekta</p>
        <h1 className="text-2xl font-semibold">Nastavitve projekta</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Osnovni podatki</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1">
            <Label>Ime projekta</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid gap-1">
            <Label>Opis</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <Label>Neto m2</Label>
            <Input
              type="number"
              value={form.netoM2}
              onChange={(e) => setForm((f) => ({ ...f, netoM2: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <Label>Bruto m2</Label>
            <Input
              type="number"
              value={form.brutoM2}
              onChange={(e) => setForm((f) => ({ ...f, brutoM2: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <Label>Volumen m3</Label>
            <Input
              type="number"
              value={form.volumenM3}
              onChange={(e) => setForm((f) => ({ ...f, volumenM3: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <Label>Primarni kazalnik</Label>
            <Select
              value={form.primaryMetric}
              onChange={(e) => setForm((f) => ({ ...f, primaryMetric: e.target.value }))}
            >
              <option value="NETO_M2">€/m2 (neto)</option>
              <option value="BRUTO_M2">€/m2 (bruto)</option>
              <option value="VOLUMEN_M3">€/m3</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save}>Shrani nastavitve</Button>
      </div>
    </div>
  );
}
