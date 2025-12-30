"use client";

import { useEffect, useState } from "react";
import { useProjectContext } from "@/components/project-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Layers, Plus } from "lucide-react";

export default function PhasesPage() {
  const { selectedProjectId } = useProjectContext();
  const [phases, setPhases] = useState<any[]>([]);
  const [phaseName, setPhaseName] = useState("");
  const [subphaseName, setSubphaseName] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  const load = async () => {
    if (!selectedProjectId) return;
    const res = await fetch(`/api/phases?projectId=${selectedProjectId}`);
    const json = await res.json();
    setPhases(json.phases || []);
  };

  const createPhase = async () => {
    if (!phaseName || !selectedProjectId) return;
    await fetch("/api/phases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: phaseName, projectId: selectedProjectId }),
    });
    setPhaseName("");
    load();
  };

  const createSubphase = async (phaseId: number) => {
    const name = subphaseName[phaseId];
    if (!name) return;
    await fetch("/api/subphases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phaseId, name }),
    });
    setSubphaseName((prev) => ({ ...prev, [phaseId]: "" }));
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Šifrant faz in podfaz</p>
          <h1 className="text-2xl font-semibold">Faze gradnje</h1>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Nova faza"
            value={phaseName}
            onChange={(e) => setPhaseName(e.target.value)}
            className="w-64"
          />
          <Button onClick={createPhase} className="gap-2">
            <Plus className="h-4 w-4" /> Dodaj fazo
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {phases.map((phase) => (
          <Card key={phase.id}>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Layers className="h-4 w-4 text-blue-600" />
                  {phase.name}
                </CardTitle>
                <p className="text-xs text-slate-500">{phase.subphases?.length || 0} podfaz</p>
              </div>
              <Badge className="bg-slate-100 text-slate-700">{phase.orderIndex + 1}. faza</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Dodaj podfazo"
                  value={subphaseName[phase.id] || ""}
                  onChange={(e) => setSubphaseName((prev) => ({ ...prev, [phase.id]: e.target.value }))}
                />
                <Button variant="outline" onClick={() => createSubphase(phase.id)}>
                  Dodaj
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {phase.subphases?.map((sub: any) => (
                  <Badge key={sub.id}>{sub.name}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
