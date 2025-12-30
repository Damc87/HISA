import { useProjectContext } from "@/components/project-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, Plus } from "lucide-react";

export function NoProjectState() {
  const { createDemoProject } = useProjectContext();

  return (
    <Card className="border-dashed border-slate-200 bg-white/70">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="rounded-full bg-blue-100 p-2">
          <Layers className="h-5 w-5 text-blue-700" />
        </div>
        <div>
          <CardTitle className="text-base">Noben projekt še ni izbran</CardTitle>
          <p className="text-sm text-slate-600">Začni z dodajanjem novega projekta ali uporabi pripravljeni primer.</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button onClick={createDemoProject} className="gap-2">
          <Plus className="h-4 w-4" />
          Ustvari primer projekta
        </Button>
        <p className="text-sm text-slate-500">ali klikni »Nov projekt« zgoraj desno.</p>
      </CardContent>
    </Card>
  );
}
