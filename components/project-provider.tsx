"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";

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
  activeProject?: Project;
  selectedProjectId?: number;
  setSelectedProjectId: (id?: number) => void;
  refresh: () => Promise<void>;
  loading: boolean;
  createDemoProject: () => Promise<void>;
  createProject: (data: CreateProjectPayload) => Promise<Project | undefined>;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const preferredProjectRef = useRef<number | undefined>(undefined);

  const activeProject = useMemo(() => (selectedProjectId ? projects.find((p) => p.id === selectedProjectId) : undefined), [projects, selectedProjectId]);

  const applySelection = (projectId: number | undefined, list: Project[]) => {
    if (projectId && list.some((p) => p.id === projectId)) {
      setSelectedProjectId(projectId);
      localStorage.setItem("selectedProjectId", projectId.toString());
    } else {
      setSelectedProjectId(undefined);
      localStorage.removeItem("selectedProjectId");
    }
  };

  const load = async (preferredId?: number) => {
    try {
      setLoading(true);
      const res = await fetch("/api/projects");
      if (!res.ok) {
        throw new Error("Napaka pri nalaganju projektov");
      }
      const data = await res.json();
      const projectList: Project[] = data.projects || [];
      setProjects(projectList);
      const saved = preferredId ?? preferredProjectRef.current ?? selectedProjectId;
      applySelection(saved, projectList);
    } catch (error: any) {
      console.error("Napaka pri nalaganju projektov", error);
      toast({
        title: "Napaka pri nalaganju projektov",
        description: error?.message,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("selectedProjectId");
    const savedId = saved ? Number(saved) : undefined;
    if (savedId) {
      preferredProjectRef.current = savedId;
      setSelectedProjectId(savedId);
    }
    load(savedId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: ProjectContextValue = {
    projects,
    activeProject,
    selectedProjectId,
    setSelectedProjectId: (id?: number) => {
      applySelection(id, projects);
    },
    refresh: () => load(selectedProjectId),
    loading,
    createDemoProject: async () => {
      const res = await fetch("/api/projects/seed-example", { method: "POST" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message = json?.message || "Napaka pri pripravi vzorčnega projekta";
        toast({ title: "Napolnitev ni uspela", description: message, variant: "error" });
        throw new Error(message);
      }
      await load(json?.project?.id);
    },
    createProject: async (payload: CreateProjectPayload) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.status === "error") {
        const message = json?.message || json?.error || "Napaka pri ustvarjanju projekta";
        throw new Error(message);
      }
      await load(json.project?.id);
      return json.project;
    },
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjectContext() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjectContext must be used within ProjectProvider");
  return ctx;
}
