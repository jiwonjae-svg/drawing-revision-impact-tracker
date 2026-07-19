"use client";

import { useActionState } from "react";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { createRevisionAction, type RevisionActionState } from "@/app/actions/revisions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FormOptions = {
  drawings: { id: string; number: string; title: string; project: { code: string } }[];
  owners: { id: string; name: string; role: string }[];
};

const impactTypes = ["DRAWING", "PROCESS", "WORK_PACKAGE", "MATERIAL", "SCHEDULE", "QUALITY", "SAFETY"];
const riskLevels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const initialRevisionActionState: RevisionActionState = { ok: false, message: "" };

export function RevisionForm({ options, defaultDrawingId, defaultOwnerId }: { options: FormOptions; defaultDrawingId?: string; defaultOwnerId?: string }) {
  const [state, action, pending] = useActionState(createRevisionAction, initialRevisionActionState);
  return (
    <form action={action} className="space-y-8">
      {state.message ? <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert"><AlertCircle className="mt-0.5 size-4 shrink-0" /><span>{state.message}</span></div> : null}

      <section className="space-y-4"><div><h2 className="text-base font-semibold">Revision identity</h2><p className="text-sm text-muted-foreground">Select the controlled drawing and assign the next revision code.</p></div><div className="grid gap-4 md:grid-cols-[1fr_180px]">
        <div className="space-y-1.5"><Label htmlFor="drawingId">Controlled drawing</Label><select id="drawingId" name="drawingId" defaultValue={defaultDrawingId ?? ""} required className="h-9 w-full rounded-lg border bg-background px-3 text-sm"><option value="" disabled>Select a drawing</option>{options.drawings.map((drawing) => <option key={drawing.id} value={drawing.id}>{drawing.number} — {drawing.title}</option>)}</select>{state.errors?.drawingId ? <p className="text-xs text-destructive">{state.errors.drawingId[0]}</p> : null}</div>
        <div className="space-y-1.5"><Label htmlFor="revisionCode">Revision code</Label><Input id="revisionCode" name="revisionCode" placeholder="C" maxLength={8} required />{state.errors?.revisionCode ? <p className="text-xs text-destructive">{state.errors.revisionCode[0]}</p> : null}</div>
      </div></section>

      <section className="space-y-4 border-t pt-7"><div><h2 className="text-base font-semibold">Change definition</h2><p className="text-sm text-muted-foreground">State what changed, why it changed, and the planned control dates.</p></div><div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-1.5 lg:col-span-2"><Label htmlFor="summary">Change summary</Label><Textarea id="summary" name="summary" rows={3} placeholder="Describe the changed geometry, interface, or requirement." required />{state.errors?.summary ? <p className="text-xs text-destructive">{state.errors.summary[0]}</p> : null}</div>
        <div className="space-y-1.5 lg:col-span-2"><Label htmlFor="reason">Reason for change</Label><Textarea id="reason" name="reason" rows={3} placeholder="Describe the issue, review finding, or production constraint driving the change." required />{state.errors?.reason ? <p className="text-xs text-destructive">{state.errors.reason[0]}</p> : null}</div>
        <div className="space-y-1.5"><Label htmlFor="riskLevel">Overall risk</Label><select id="riskLevel" name="riskLevel" defaultValue="MEDIUM" className="h-9 w-full rounded-lg border bg-background px-3 text-sm">{riskLevels.map((risk) => <option key={risk} value={risk}>{risk[0] + risk.slice(1).toLowerCase()}</option>)}</select></div>
        <div className="space-y-1.5"><Label htmlFor="ownerId">Responsible owner</Label><select id="ownerId" name="ownerId" defaultValue={defaultOwnerId ?? options.owners[0]?.id} className="h-9 w-full rounded-lg border bg-background px-3 text-sm">{options.owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name} · {owner.role.toLowerCase()}</option>)}</select></div>
        <div className="space-y-1.5"><Label htmlFor="effectiveDate">Planned effective date</Label><Input id="effectiveDate" name="effectiveDate" type="date" required />{state.errors?.effectiveDate ? <p className="text-xs text-destructive">{state.errors.effectiveDate[0]}</p> : <p className="text-xs text-muted-foreground">Required before controlled issue.</p>}</div>
        <div className="space-y-1.5"><Label htmlFor="dueDate">Control due date</Label><Input id="dueDate" name="dueDate" type="date" /></div>
        <div className="space-y-1.5 lg:col-span-2"><Label htmlFor="mitigation">Risk mitigation</Label><Textarea id="mitigation" name="mitigation" rows={3} placeholder="For high or critical risk: hold point, verification method, owner communication, and recovery action." />{state.errors?.mitigation ? <p className="text-xs text-destructive">{state.errors.mitigation[0]}</p> : null}</div>
      </div></section>

      <section className="space-y-4 border-t pt-7"><div><h2 className="text-base font-semibold">Impact register</h2><p className="text-sm text-muted-foreground">Record at least one affected drawing, process, work package, material, schedule, quality, or safety control.</p></div>{[0, 1].map((index) => <div key={index} className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[160px_1fr_160px] lg:grid-cols-[160px_1fr_180px]">
        <div className="space-y-1.5"><Label htmlFor={`impactType-${index}`}>Impact type</Label><select id={`impactType-${index}`} name="impactType" defaultValue={index === 0 ? "PROCESS" : "WORK_PACKAGE"} className="h-9 w-full rounded-lg border bg-background px-2 text-sm">{impactTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ").toLowerCase()}</option>)}</select></div>
        <div className="space-y-1.5"><Label htmlFor={`impactTarget-${index}`}>Affected target</Label><Input id={`impactTarget-${index}`} name="impactTarget" placeholder={index === 0 ? "e.g. Welding" : "e.g. WP-B102-04"} required={index === 0} /></div>
        <div className="space-y-1.5"><Label htmlFor={`impactSeverity-${index}`}>Severity</Label><select id={`impactSeverity-${index}`} name="impactSeverity" defaultValue={index === 0 ? "MEDIUM" : "LOW"} className="h-9 w-full rounded-lg border bg-background px-2 text-sm">{riskLevels.map((risk) => <option key={risk} value={risk}>{risk[0] + risk.slice(1).toLowerCase()}</option>)}</select></div>
        <div className="space-y-1.5 md:col-span-3"><Label htmlFor={`impactDescription-${index}`}>Impact description</Label><Input id={`impactDescription-${index}`} name="impactDescription" placeholder="Describe what must be checked, held, or updated." required={index === 0} /></div>
      </div>)}{state.errors?.impacts ? <p className="text-xs text-destructive">{state.errors.impacts[0]}</p> : null}</section>

      <div className="flex items-center justify-end gap-3 border-t pt-6"><p className="mr-auto hidden text-xs text-muted-foreground sm:block">New revisions start as Draft and must pass every release gate.</p><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : null}Create draft revision</Button></div>
    </form>
  );
}
