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

export type CreateProjectPayload = {
  name: string;
  description?: string;
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
  loading: boolean;
  createDemoProject: () => Promise<void>;
  createProject: (data: CreateProjectPayload) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const pickSelection = (list: Project[], preferredId?: number) => {
    const stored = localStorage.getItem("selectedProjectId");
    const storedId = stored ? Number(stored) : undefined;
    const candidates = [preferredId, storedId, selectedProjectId, list[0]?.id];
    const match = candidates.find((id) => id && list.some((p) => p.id === id));
    return match;
  };

  const load = async (preferredId?: number) => {
    try {
      setLoading(true);
      const res = await fetch("/api/projects");
      if (!res.ok) {
        console.error("Napaka pri nalaganju projektov");
        return;
      }
      const data = await res.json();
      setProjects(data.projects);
      const chosen = pickSelection(data.projects, preferredId);
      if (chosen) {
        setSelectedProjectId(chosen);
        localStorage.setItem("selectedProjectId", chosen.toString());
      } else {
        setSelectedProjectId(undefined);
        localStorage.removeItem("selectedProjectId");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("selectedProjectId");
    load(saved ? Number(saved) : undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: ProjectContextValue = {
    projects,
    selectedProjectId,
    setSelectedProjectId: (id: number) => {
      if (!id) return;
      setSelectedProjectId(id);
      localStorage.setItem("selectedProjectId", id.toString());
    },
    refresh: load,
    loading,
    createDemoProject: async () => {
      const res = await fetch("/api/projects/seed", { method: "POST" });
      const json = await res.json().catch(() => null);
      await load(json?.project?.id);
    },
    createProject: async (payload: CreateProjectPayload) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.error || "Napaka pri ustvarjanju projekta");
      }
      const json = await res.json();
      await load(json.project?.id);
    },
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjectContext() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjectContext must be used within ProjectProvider");
  return ctx;
}
