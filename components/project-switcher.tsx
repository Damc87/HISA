"use client";

import { useProjectContext } from "@/components/project-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";

export function ProjectSwitcher() {
  const { projects, selectedProjectId, setSelectedProjectId, refresh, loading, createDemoProject } = useProjectContext();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    if (res.ok) {
      setName("");
      setDescription("");
      setOpen(false);
      await refresh();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={selectedProjectId?.toString() || ""}
        onChange={(e) => setSelectedProjectId(Number(e.target.value))}
        className="w-64"
        disabled={!projects.length || loading}
      >
        {!projects.length ? <option>Ni projektov</option> : null}
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </Select>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Nov projekt
      </Button>
      {!projects.length && (
        <Button variant="ghost" onClick={createDemoProject}>
          Ustvari primer projekta
        </Button>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Prekliči
          </Button>
          <Button onClick={handleCreate} disabled={!name}>
            Shrani projekt
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
