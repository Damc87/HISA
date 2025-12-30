"use client";

import { useEffect, useState } from "react";
import { useProjectContext } from "@/components/project-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button, buttonVariants } from "@/components/ui/button";
import { FileText, Link } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { NoProjectState } from "@/components/no-project";

export default function DocumentsPage() {
  const { selectedProjectId } = useProjectContext();
  const [documents, setDocuments] = useState<any[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [filters, setFilters] = useState({ phaseId: "", contractorId: "" });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  const load = async () => {
    if (!selectedProjectId) return;
    const [docsRes, phaseRes, contractorRes] = await Promise.all([
      fetch(`/api/documents?projectId=${selectedProjectId}`),
      fetch(`/api/phases?projectId=${selectedProjectId}`),
      fetch(`/api/contractors?projectId=${selectedProjectId}`),
    ]);
    const docs = await docsRes.json();
    const p = await phaseRes.json();
    const c = await contractorRes.json();
    setDocuments(docs.documents || []);
    setPhases(p.phases || []);
    setContractors(c.contractors || []);
  };

  const applyFilters = async () => {
    if (!selectedProjectId) return;
    const params = new URLSearchParams({ projectId: selectedProjectId.toString() });
    if (filters.phaseId) params.set("phaseId", filters.phaseId);
    if (filters.contractorId) params.set("contractorId", filters.contractorId);
    const res = await fetch(`/api/documents?${params.toString()}`);
    const json = await res.json();
    setDocuments(json.documents || []);
  };

  if (!selectedProjectId) {
    return <NoProjectState />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">PDF računi in dokumentacija</p>
          <h1 className="text-2xl font-semibold">Dokumenti</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtri</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="grid gap-1">
            <Label>Faza</Label>
            <Select
              value={filters.phaseId}
              onChange={(e) => setFilters((f) => ({ ...f, phaseId: e.target.value }))}
              onBlur={applyFilters}
            >
              <option value="">Vse</option>
              {phases.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-1">
            <Label>Izvajalec</Label>
            <Select
              value={filters.contractorId}
              onChange={(e) => setFilters((f) => ({ ...f, contractorId: e.target.value }))}
              onBlur={applyFilters}
            >
              <option value="">Vsi</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={applyFilters}>Osveži</Button>
          </div>
        </CardContent>
      </Card>

      {documents.length === 0 ? (
        <Card className="border-dashed bg-white/80">
          <CardHeader>
            <CardTitle className="text-base">Ni dokumentov</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Naložite prvi PDF račun neposredno iz pogleda »Stroški« in ga povežite s postavko.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader className="flex flex-row items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <CardTitle className="text-base">{doc.originalName}</CardTitle>
                  <p className="text-xs text-slate-500">Naloženo: {formatDate(doc.uploadedAt)}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <p>Faza: {doc.phase?.name || "-"}</p>
                <p>Izvajalec: {doc.contractor?.name || "-"}</p>
                {doc.costItems?.[0] && (
                  <p className="flex items-center gap-1 text-blue-700">
                    <Link className="h-4 w-4" />
                    Povezano s stroškom #{doc.costItems[0].id}
                  </p>
                )}
                <div className="flex gap-2">
                  <a
                    className={buttonVariants({ variant: "outline", className: "w-full text-center" })}
                    href={`/api/documents/${doc.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Odpri PDF
                  </a>
                  {doc.costItems?.[0] && (
                    <a
                      className={buttonVariants({ variant: "ghost", className: "w-full text-center" })}
                      href={`/costs#cost-${doc.costItems[0].id}`}
                    >
                      Na strošek
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
