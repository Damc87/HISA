"use client";

import { useEffect, useState } from "react";
import { useProjectContext } from "@/components/project-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users } from "lucide-react";
import { NoProjectState } from "@/components/no-project";

export default function ContractorsPage() {
  const { selectedProjectId } = useProjectContext();
  const [contractors, setContractors] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", contact: "", email: "", phone: "" });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  const load = async () => {
    if (!selectedProjectId) return;
    const res = await fetch(`/api/contractors?projectId=${selectedProjectId}`);
    const json = await res.json();
    setContractors(json.contractors || []);
  };

  const createContractor = async () => {
    if (!form.name || !selectedProjectId) return;
    await fetch("/api/contractors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, projectId: selectedProjectId }),
    });
    setForm({ name: "", contact: "", email: "", phone: "" });
    load();
  };

  if (!selectedProjectId) {
    return <NoProjectState />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Upravljanje izvajalcev</p>
          <h1 className="text-2xl font-semibold">Izvajalci</h1>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Naziv izvajalca"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-60"
          />
          <Input
            placeholder="Kontakt"
            value={form.contact}
            onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
            className="w-48"
          />
          <Input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-48"
          />
          <Input
            placeholder="Telefon"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="w-40"
          />
          <Button onClick={createContractor}>Dodaj</Button>
        </div>
      </div>

      {contractors.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Začnite z dodajanjem prvega izvajalca</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Vnesite naziv izvajalca in kliknite »Dodaj« za začetek vodenja kontaktov in računov.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {contractors.map((c) => (
            <Card key={c.id}>
              <CardHeader className="flex flex-row items-center gap-3">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <CardTitle className="text-base font-semibold">{c.name}</CardTitle>
                  <p className="text-xs text-slate-500">{c.contact || "Brez kontakta"}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-slate-600">
                <p>Email: {c.email || "-"}</p>
                <p>Telefon: {c.phone || "-"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
