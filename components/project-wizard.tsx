"use client";

import { useState } from "react";
import { useProjectContext } from "@/components/project-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type ProjectWizardProps = {
  triggerLabel: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  className?: string;
};

export function ProjectWizard({ triggerLabel, variant = "default", className }: ProjectWizardProps) {
  const { createProject } = useProjectContext();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [netoM2, setNetoM2] = useState<string>("");
  const [brutoM2, setBrutoM2] = useState<string>("");
  const [volumenM3, setVolumenM3] = useState<string>("");
  const [primaryMetric, setPrimaryMetric] = useState<string>("NETO_M2");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName("");
    setDescription("");
    setNetoM2("");
    setBrutoM2("");
    setVolumenM3("");
    setPrimaryMetric("NETO_M2");
  };

  const handleCreate = async () => {
    if (!name) return;
    try {
      setSubmitting(true);
      await createProject({
        name,
        description,
        netoM2: netoM2 ? Number(netoM2) : null,
        brutoM2: brutoM2 ? Number(brutoM2) : null,
        volumenM3: volumenM3 ? Number(volumenM3) : null,
        primaryMetric,
      });
      setOpen(false);
      reset();
    } catch (error) {
      console.error("Napaka pri ustvarjanju projekta", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)} className={className}>
        {triggerLabel}
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title="Dodaj projekt"
        description="Pripravi nov projekt gradnje z lastnim šifrantom faz."
      >
        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label htmlFor="project-name">Ime projekta</Label>
            <Input
              id="project-name"
              placeholder="npr. Enodružinska hiša 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="project-desc">Opis</Label>
            <Input
              id="project-desc"
              placeholder="Lokacija, investitor ..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="primary-metric">Primarni kazalnik</Label>
            <Select id="primary-metric" value={primaryMetric || ""} onChange={(e) => setPrimaryMetric(e.target.value)}>
              <option value="NETO_M2">€/m2 neto</option>
              <option value="BRUTO_M2">€/m2 bruto</option>
              <option value="VOLUMEN_M3">€/m3</option>
            </Select>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="grid gap-1">
              <Label htmlFor="neto-m2">Neto površina (m2)</Label>
              <Input id="neto-m2" type="number" value={netoM2} onChange={(e) => setNetoM2(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="bruto-m2">Bruto površina (m2)</Label>
              <Input id="bruto-m2" type="number" value={brutoM2} onChange={(e) => setBrutoM2(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="volumen-m3">Volumen (m3)</Label>
              <Input id="volumen-m3" type="number" value={volumenM3} onChange={(e) => setVolumenM3(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Prekliči
          </Button>
          <Button onClick={handleCreate} disabled={!name || submitting}>
            {submitting ? "Shranjujem ..." : "Shrani projekt"}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
