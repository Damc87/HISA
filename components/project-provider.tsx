"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Project = {
  id: number;
  name: string;
  description?: string | null;
  netoM2?: number | null;
  brutoM2?: number | null;
  volumenM3?: number | null;
  primaryMetric?: string | null;
};

interface ProjectContextValue {
  projects: Project[];
  selectedProjectId?: number;
  setSelectedProjectId: (id: number) => void;
  refresh: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);

  const load = async () => {
    const res = await fetch("/api/projects");
    if (!res.ok) {
      console.error("Napaka pri nalaganju projektov");
      return;
    }
    const data = await res.json();
    setProjects(data.projects);
    if (!selectedProjectId && data.projects.length) {
      setSelectedProjectId(data.projects[0].id);
      localStorage.setItem("selectedProjectId", data.projects[0].id.toString());
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("selectedProjectId");
    if (saved) {
      setSelectedProjectId(Number(saved));
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: ProjectContextValue = {
    projects,
    selectedProjectId,
    setSelectedProjectId: (id: number) => {
      setSelectedProjectId(id);
      localStorage.setItem("selectedProjectId", id.toString());
    },
    refresh: load,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjectContext() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjectContext must be used within ProjectProvider");
  return ctx;
}
