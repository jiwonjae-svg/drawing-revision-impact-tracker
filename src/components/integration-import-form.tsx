"use client";

import { useActionState } from "react";
import { Download, LoaderCircle, Upload } from "lucide-react";
import { importDrawingRegisterAction } from "@/app/actions/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { ok: false, message: "" };

export function IntegrationImportForm({ projects }: { projects: { id: string; code: string; name: string }[] }) {
  const [state, action, pending] = useActionState(importDrawingRegisterAction, initialState);
  return (
    <form action={action} className="space-y-4 rounded-lg border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="text-base font-semibold">Import drawing register</h2><p className="mt-1 text-sm text-muted-foreground">Validated CSV metadata only. Drawing numbers must use the synthetic DEMO project prefix.</p></div>
        <Button nativeButton={false} variant="outline" size="sm" render={<a href="/api/integrations/template" download />}><Download />Template</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="projectId">Project</Label><select id="projectId" name="projectId" required className="h-9 w-full rounded-lg border bg-background px-3 text-sm">{projects.map((project) => <option key={project.id} value={project.id}>{project.code} · {project.name}</option>)}</select></div>
        <div className="space-y-1.5"><Label htmlFor="drawingRegister">CSV file</Label><Input id="drawingRegister" name="drawingRegister" type="file" accept=".csv,text/csv" required /></div>
      </div>
      {state.message ? <p role="status" className={state.ok ? "text-sm text-emerald-700" : "text-sm text-destructive"}>{state.message}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : <Upload />}Validate and import</Button>
    </form>
  );
}
