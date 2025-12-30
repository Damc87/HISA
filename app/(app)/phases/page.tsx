"use client";

import { useEffect, useState } from "react";
import { useProjectContext } from "@/components/project-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Layers, Plus, ArrowUp, ArrowDown, Trash2, Check } from "lucide-react";
import { NoProjectState } from "@/components/no-project";
import { useToast } from "@/components/ui/toast";
import { z } from "zod";

export default function PhasesPage() {
  const { selectedProjectId } = useProjectContext();
  const { toast } = useToast();
  const [phases, setPhases] = useState<any[]>([]);
  const [phaseName, setPhaseName] = useState("");
  const [subphaseName, setSubphaseName] = useState<{ [key: number]: string }>({});
  const [editNames, setEditNames] = useState<{ [key: number]: string }>({});
  const [editSubNames, setEditSubNames] = useState<{ [key: number]: string }>({});

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
    const parsed = z.string().min(2, "Ime faze je prekratko").safeParse(phaseName.trim());
    if (!parsed.success) {
      toast({ title: "Napaka pri vnosu", description: parsed.error.errors[0].message, variant: "error" });
      return;
    }
    await fetch("/api/phases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: parsed.data, projectId: selectedProjectId }),
    });
    setPhaseName("");
    toast({ title: "Faza dodana", variant: "success" });
    load();
  };

  const updatePhase = async (phaseId: number) => {
    const name = editNames[phaseId];
    const parsed = z.string().min(2, "Ime faze je prekratko").safeParse(name?.trim());
    if (!parsed.success) {
      toast({ title: "Napaka pri shranjevanju", description: parsed.error.errors[0].message, variant: "error" });
      return;
    }
    await fetch("/api/phases", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: phaseId, name: parsed.data }),
    });
    toast({ title: "Faza posodobljena", variant: "success" });
    load();
  };

  const deletePhase = async (phaseId: number) => {
    if (!confirm("Izbris faze bo odstranil tudi podfazne povezave. Nadaljujem?")) return;
    await fetch(`/api/phases?id=${phaseId}`, { method: "DELETE" });
    toast({ title: "Faza izbrisana", variant: "success" });
    load();
  };

  const movePhase = async (phaseId: number, direction: "up" | "down") => {
    const currentIndex = phases.findIndex((p) => p.id === phaseId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= phases.length) return;

    const updated = [...phases];
    const [moved] = updated.splice(currentIndex, 1);
    updated.splice(targetIndex, 0, moved);
    const payload = updated.map((p, index) => ({ id: p.id, orderIndex: index }));
    setPhases(updated);
    await fetch("/api/phases", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phases: payload }),
    });
  };

  const createSubphase = async (phaseId: number) => {
    const name = subphaseName[phaseId];
    const parsed = z.string().min(2, "Ime podfaze je prekratko").safeParse(name?.trim());
    if (!parsed.success) {
      toast({ title: "Napaka pri vnosu", description: parsed.error.errors[0].message, variant: "error" });
      return;
    }
    await fetch("/api/subphases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phaseId, name: parsed.data }),
    });
    setSubphaseName((prev) => ({ ...prev, [phaseId]: "" }));
    toast({ title: "Podfaza dodana", variant: "success" });
    load();
  };

  const updateSubphase = async (subphaseId: number) => {
    const name = editSubNames[subphaseId];
    const parsed = z.string().min(2, "Ime podfaze je prekratko").safeParse(name?.trim());
    if (!parsed.success) {
      toast({ title: "Napaka pri shranjevanju", description: parsed.error.errors[0].message, variant: "error" });
      return;
    }
    await fetch("/api/subphases", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: subphaseId, name: parsed.data }),
    });
    toast({ title: "Podfaza posodobljena", variant: "success" });
    load();
  };

  const moveSubphase = async (phaseId: number, subphaseId: number, direction: "up" | "down") => {
    const phase = phases.find((p) => p.id === phaseId);
    if (!phase) return;
    const list = [...(phase.subphases || [])];
    const currentIndex = list.findIndex((s) => s.id === subphaseId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const [moved] = list.splice(currentIndex, 1);
    list.splice(targetIndex, 0, moved);
    const updates = list.map((s, idx) => ({ ...s, orderIndex: idx }));
    await Promise.all(
      updates.map((s) =>
        fetch("/api/subphases", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: s.id, orderIndex: s.orderIndex }),
        })
      )
    );
    load();
  };

  const deleteSubphase = async (subphaseId: number) => {
    if (!confirm("Izbrisati podfazo?")) return;
    await fetch(`/api/subphases?id=${subphaseId}`, { method: "DELETE" });
    toast({ title: "Podfaza izbrisana", variant: "success" });
    load();
  };

  if (!selectedProjectId) {
    return <NoProjectState />;
  }

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
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Layers className="h-4 w-4 text-blue-600" />
                  <Input
                    value={editNames[phase.id] ?? phase.name}
                    onChange={(e) => setEditNames((prev) => ({ ...prev, [phase.id]: e.target.value }))}
                    className="h-9"
                  />
                </CardTitle>
                <p className="text-xs text-slate-500">{phase.subphases?.length || 0} podfaz</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className="bg-slate-100 text-slate-700">{phase.orderIndex + 1}. faza</Badge>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => movePhase(phase.id, "up")}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => movePhase(phase.id, "down")}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deletePhase(phase.id)}>
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => updatePhase(phase.id)}>
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
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
              <div className="space-y-2">
                {phase.subphases?.map((sub: any, idx: number) => (
                  <div key={sub.id} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <Badge variant="secondary">{idx + 1}</Badge>
                    <Input
                      value={editSubNames[sub.id] ?? sub.name}
                      onChange={(e) => setEditSubNames((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                      className="h-9 flex-1"
                    />
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => moveSubphase(phase.id, sub.id, "up")}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => moveSubphase(phase.id, sub.id, "down")}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="outline" onClick={() => updateSubphase(sub.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteSubphase(sub.id)}>
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
