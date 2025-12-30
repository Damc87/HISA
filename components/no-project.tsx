import { useProjectContext } from "@/components/project-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, Plus } from "lucide-react";
import { ProjectWizard } from "@/components/project-wizard";

export function NoProjectState() {
  const { createDemoProject, projects, setSelectedProjectId } = useProjectContext();
  const selectFirst = () => {
    if (projects[0]) {
      setSelectedProjectId(projects[0].id);
    }
  };

  const handleSeed = async () => {
    try {
      await createDemoProject();
    } catch {
      // toast is handled inside provider
    }
  };

  return (
    <Card className="border-dashed border-slate-200 bg-white/70">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="rounded-full bg-blue-100 p-2">
          <Layers className="h-5 w-5 text-blue-700" />
        </div>
        <div>
          <CardTitle className="text-base">Izberi ali ustvari projekt</CardTitle>
          <p className="text-sm text-slate-600">Začni z ustvarjanjem prvega projekta ali izberi obstoječega.</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <ProjectWizard triggerLabel="Ustvari prvi projekt" />
        <Button onClick={handleSeed} className="gap-2" variant="outline">
          <Plus className="h-4 w-4" />
          Napolni s primerom
        </Button>
        {projects.length > 0 && (
          <Button variant="ghost" onClick={selectFirst}>
            Izberi obstoječi projekt
          </Button>
        )}
        <p className="text-sm text-slate-500">Kadarkoli lahko dodaš še več projektov v zgornjem izbirniku.</p>
      </CardContent>
    </Card>
  );
}
