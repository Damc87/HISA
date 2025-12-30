"use client";

import { useProjectContext } from "@/components/project-provider";
import { ProjectWizard } from "@/components/project-wizard";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export function ProjectSwitcher() {
  const { projects, selectedProjectId, setSelectedProjectId, loading, createDemoProject } = useProjectContext();

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
      <ProjectWizard
        triggerLabel={projects.length ? "Nov projekt" : "Ustvari prvi projekt"}
        variant={projects.length ? "outline" : "default"}
      />
      {!projects.length && (
        <Button variant="ghost" onClick={createDemoProject} className="underline underline-offset-2">
          Napolni z vzorčnimi podatki
        </Button>
      )}
    </div>
  );
}
