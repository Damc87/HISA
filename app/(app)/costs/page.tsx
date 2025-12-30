"use client";

import { useEffect, useMemo, useState } from "react";
import { useProjectContext } from "@/components/project-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TR, TH, TBody, TD } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Download, FileUp, Filter, Plus, Upload } from "lucide-react";

const statusOptions = [
  { value: "PLANIRANO", label: "Planirano" },
  { value: "POTRJENO", label: "Potrjeno" },
  { value: "PLACANO", label: "Plačano" },
];

const typeOptions = [
  { value: "MATERIAL", label: "Material" },
  { value: "DELO", label: "Delo" },
  { value: "STROJ", label: "Stroj" },
  { value: "PREVOZ", label: "Prevoz" },
  { value: "OSTALO", label: "Ostalo" },
];

export default function CostsPage() {
  const { selectedProjectId } = useProjectContext();
  const [costs, setCosts] = useState<any[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [subphases, setSubphases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    phaseId: "",
    contractorId: "",
    status: "",
    tip: "",
    search: "",
  });
  const [form, setForm] = useState<any>({
    date: "",
    phaseId: "",
    subphaseId: "",
    contractorId: "",
    opis: "",
    kolicina: 1,
    enota: "kos",
    cenaBrezDDV: 0,
    ddvStopnja: 0.22,
    tip: "MATERIAL",
    status: "PLANIRANO",
    nacinPlacila: "",
    stevilkaRacuna: "",
    datumRacuna: "",
    datumZapadlosti: "",
    opombe: "",
    documentId: "",
  });

  const cenaZDDV = useMemo(() => {
    const k = Number(form.kolicina) || 0;
    const c = Number(form.cenaBrezDDV) || 0;
    const ddv = Number(form.ddvStopnja) || 0;
    return k * c * (1 + ddv);
  }, [form.kolicina, form.cenaBrezDDV, form.ddvStopnja]);

  useEffect(() => {
    if (!selectedProjectId) return;
    loadDependencies();
    loadCosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  const loadDependencies = async () => {
    if (!selectedProjectId) return;
    const [phaseRes, contractorRes] = await Promise.all([
      fetch(`/api/phases?projectId=${selectedProjectId}`),
      fetch(`/api/contractors?projectId=${selectedProjectId}`),
    ]);
    const phaseJson = await phaseRes.json();
    const contractorJson = await contractorRes.json();
    setPhases(phaseJson.phases || []);
    setSubphases((phaseJson.phases || []).flatMap((p: any) => p.subphases));
    setContractors(contractorJson.contractors || []);
  };

  const loadCosts = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    const params = new URLSearchParams({ projectId: selectedProjectId.toString() });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value.toString());
    });
    const res = await fetch(`/api/costs?${params.toString()}`);
    const json = await res.json();
    setCosts(json.costs || []);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      date: "",
      phaseId: "",
      subphaseId: "",
      contractorId: "",
      opis: "",
      kolicina: 1,
      enota: "kos",
      cenaBrezDDV: 0,
      ddvStopnja: 0.22,
      tip: "MATERIAL",
      status: "PLANIRANO",
      nacinPlacila: "",
      stevilkaRacuna: "",
      datumRacuna: "",
      datumZapadlosti: "",
      opombe: "",
      documentId: "",
    });
    setFile(null);
    setEditing(null);
  };

  const openNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const saveCost = async () => {
    if (!selectedProjectId) return;
    const payload = {
      ...form,
      projectId: selectedProjectId,
    };
    const url = editing ? `/api/costs/${editing.id}` : "/api/costs";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const saved = (await res.json()).cost;
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("projectId", selectedProjectId.toString());
        if (form.contractorId) fd.append("contractorId", form.contractorId.toString());
        if (form.phaseId) fd.append("phaseId", form.phaseId.toString());
        fd.append("costItemId", (saved?.id || editing?.id).toString());
        await fetch("/api/documents/upload", { method: "POST", body: fd });
      }
      await loadCosts();
      setDialogOpen(false);
      resetForm();
    }
  };

  const editCost = (cost: any) => {
    setEditing(cost);
    setForm({
      ...cost,
      date: cost.date ? cost.date.substring(0, 10) : "",
      datumRacuna: cost.datumRacuna ? cost.datumRacuna.substring(0, 10) : "",
      datumZapadlosti: cost.datumZapadlosti ? cost.datumZapadlosti.substring(0, 10) : "",
    });
    setDialogOpen(true);
  };

  const deleteCost = async (id: number) => {
    await fetch(`/api/costs/${id}`, { method: "DELETE" });
    loadCosts();
  };

  const exportCsv = () => {
    if (!selectedProjectId) return;
    window.open(`/api/costs/export?projectId=${selectedProjectId}`, "_blank");
  };

  const importCsv = async () => {
    if (!selectedProjectId || !importFile) return;
    const fd = new FormData();
    fd.append("projectId", selectedProjectId.toString());
    fd.append("file", importFile);
    await fetch("/api/costs/import", { method: "POST", body: fd });
    setImportFile(null);
    await loadCosts();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Upravljanje stroškov</p>
          <h1 className="text-2xl font-semibold">Stroški</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={exportCsv} className="gap-2">
            <Download className="h-4 w-4" /> Izvoz v CSV
          </Button>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600">
            <Upload className="h-4 w-4" />
            <span>Uvoz CSV</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            />
          </label>
          <Button onClick={importCsv} disabled={!importFile}>Zaženi uvoz</Button>
          <Button className="gap-2" onClick={openNew}>
            <Plus className="h-4 w-4" /> Dodaj strošek
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-700">
            <Filter className="h-4 w-4" /> Filtri
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
          <div className="grid gap-1">
            <Label>Datum od</Label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
              onBlur={loadCosts}
            />
          </div>
          <div className="grid gap-1">
            <Label>Datum do</Label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
              onBlur={loadCosts}
            />
          </div>
          <div className="grid gap-1">
            <Label>Faza</Label>
            <Select
              value={filters.phaseId}
              onChange={(e) => setFilters((f) => ({ ...f, phaseId: e.target.value }))}
              onBlur={loadCosts}
            >
              <option value="">Vse</option>
              {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-1">
            <Label>Izvajalec</Label>
            <Select
              value={filters.contractorId}
              onChange={(e) => setFilters((f) => ({ ...f, contractorId: e.target.value }))}
              onBlur={loadCosts}
            >
              <option value="">Vsi</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-1">
            <Label>Status</Label>
            <Select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              onBlur={loadCosts}
            >
              <option value="">Vsi</option>
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-1">
            <Label>Tip</Label>
            <Select
              value={filters.tip}
              onChange={(e) => setFilters((f) => ({ ...f, tip: e.target.value }))}
              onBlur={loadCosts}
            >
              <option value="">Vsi</option>
              {typeOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-1 md:col-span-2 lg:col-span-2">
            <Label>Iskanje</Label>
            <Input
              placeholder="Opis ali številka računa"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              onBlur={loadCosts}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Seznam stroškov</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-6 text-sm text-slate-500">Nalaganje ...</div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Datum</TH>
                  <TH>Opis</TH>
                  <TH>Faza</TH>
                  <TH>Izvajalec</TH>
                  <TH>Status</TH>
                  <TH>Tip</TH>
                  <TH className="text-right">Znesek z DDV</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {costs.map((cost) => (
                  <TR key={cost.id} id={`cost-${cost.id}`}>
                    <TD>{formatDate(cost.date)}</TD>
                    <TD className="max-w-[240px]">
                      <div className="font-semibold text-slate-900">{cost.opis}</div>
                      <div className="text-xs text-slate-500">
                        {cost.stevilkaRacuna ? `Račun ${cost.stevilkaRacuna}` : "Brez računa"}
                      </div>
                    </TD>
                    <TD>
                      <div className="text-sm font-medium">{cost.phase?.name}</div>
                      <div className="text-xs text-slate-500">{cost.subphase?.name}</div>
                    </TD>
                    <TD>{cost.contractor?.name}</TD>
                    <TD>
                      <Badge>{statusOptions.find((s) => s.value === cost.status)?.label || cost.status}</Badge>
                    </TD>
                    <TD>{typeOptions.find((t) => t.value === cost.tip)?.label || cost.tip}</TD>
                    <TD className="text-right font-semibold">{formatCurrency(cost.cenaZDDV)}</TD>
                    <TD className="space-x-2 text-right">
                      {cost.documentId && (
                        <a
                          className="text-sm font-semibold text-blue-600 underline"
                          href={`/api/documents/${cost.documentId}`}
                          target="_blank"
                        >
                          Račun
                        </a>
                      )}
                      <Button size="sm" variant="outline" onClick={() => editCost(cost)}>
                        Uredi
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteCost(cost.id)}>
                        Izbriši
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Uredi strošek" : "Dodaj strošek"}
        description="Vnesite osnovne podatke o strošku. Znesek z DDV se izračuna samodejno."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1">
            <Label>Datum</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f: any) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <Label>Opis</Label>
            <Input value={form.opis} onChange={(e) => setForm((f: any) => ({ ...f, opis: e.target.value }))} />
          </div>
          <div className="grid gap-1">
            <Label>Faza</Label>
            <Select
              value={form.phaseId}
              onChange={(e) => setForm((f: any) => ({ ...f, phaseId: Number(e.target.value) }))}
            >
              <option value="">Izberi</option>
              {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-1">
            <Label>Podfaza</Label>
            <Select
              value={form.subphaseId}
              onChange={(e) => setForm((f: any) => ({ ...f, subphaseId: Number(e.target.value) }))}
            >
              <option value="">Izberi</option>
              {subphases
                .filter((s: any) => !form.phaseId || s.phaseId === form.phaseId)
                .map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </Select>
          </div>
          <div className="grid gap-1">
            <Label>Izvajalec</Label>
            <Select
              value={form.contractorId}
              onChange={(e) => setForm((f: any) => ({ ...f, contractorId: Number(e.target.value) }))}
            >
              <option value="">Izberi</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3 md:col-span-2">
            <div className="grid gap-1">
              <Label>Količina</Label>
              <Input
                type="number"
                value={form.kolicina}
                onChange={(e) => setForm((f: any) => ({ ...f, kolicina: Number(e.target.value) }))}
              />
            </div>
            <div className="grid gap-1">
              <Label>Enota</Label>
              <Input value={form.enota} onChange={(e) => setForm((f: any) => ({ ...f, enota: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label>DDV</Label>
              <Input
                type="number"
                step="0.01"
                value={form.ddvStopnja}
                onChange={(e) => setForm((f: any) => ({ ...f, ddvStopnja: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="grid gap-1 md:col-span-2">
            <Label>Cena brez DDV (€)</Label>
            <Input
              type="number"
              value={form.cenaBrezDDV}
              onChange={(e) => setForm((f: any) => ({ ...f, cenaBrezDDV: Number(e.target.value) }))}
            />
            <p className="text-sm text-slate-500">Cena z DDV: {formatCurrency(cenaZDDV)}</p>
          </div>
          <div className="grid gap-1">
            <Label>Tip</Label>
            <Select value={form.tip} onChange={(e) => setForm((f: any) => ({ ...f, tip: e.target.value }))}>
              {typeOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-1">
            <Label>Status</Label>
            <Select
              value={form.status}
              onChange={(e) => setForm((f: any) => ({ ...f, status: e.target.value }))}
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-1">
            <Label>Način plačila</Label>
            <Input
              value={form.nacinPlacila}
              onChange={(e) => setForm((f: any) => ({ ...f, nacinPlacila: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <Label>Št. računa</Label>
            <Input
              value={form.stevilkaRacuna}
              onChange={(e) => setForm((f: any) => ({ ...f, stevilkaRacuna: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <Label>Datum računa</Label>
            <Input
              type="date"
              value={form.datumRacuna}
              onChange={(e) => setForm((f: any) => ({ ...f, datumRacuna: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <Label>Datum zapadlosti</Label>
            <Input
              type="date"
              value={form.datumZapadlosti}
              onChange={(e) => setForm((f: any) => ({ ...f, datumZapadlosti: e.target.value }))}
            />
          </div>
          <div className="grid gap-1 md:col-span-2">
            <Label>Opombe</Label>
            <Textarea
              rows={3}
              value={form.opombe}
              onChange={(e) => setForm((f: any) => ({ ...f, opombe: e.target.value }))}
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label>PDF račun</Label>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600">
              <FileUp className="h-4 w-4" />
              <span>{file ? file.name : "Dodaj PDF"}</span>
              <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Prekliči
          </Button>
          <Button onClick={saveCost}>Shrani</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
