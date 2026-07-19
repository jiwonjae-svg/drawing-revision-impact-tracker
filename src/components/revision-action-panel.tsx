"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import { acknowledgeRevisionAction, transitionRevisionAction, type RevisionActionState } from "@/app/actions/revisions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { RevisionStatusValue, UserRoleValue } from "@/lib/domain/revision-workflow";

const initialRevisionActionState: RevisionActionState = { ok: false, message: "" };

function ActionMessage({ ok, message }: { ok: boolean; message: string }) {
  if (!message) return null;
  return <div className={ok ? "flex gap-2 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800" : "flex gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"}>{ok ? <CheckCircle2 className="mt-0.5 size-4" /> : <AlertCircle className="mt-0.5 size-4" />}<span>{message}</span></div>;
}

export function RevisionActionPanel({ revisionId, status, role, userId, createdById, acknowledgementCount }: { revisionId: string; status: RevisionStatusValue; role: UserRoleValue; userId: string; createdById: string; acknowledgementCount: number }) {
  const [transitionState, transitionAction, transitionPending] = useActionState(transitionRevisionAction, initialRevisionActionState);
  const [ackState, ackAction, ackPending] = useActionState(acknowledgeRevisionAction, initialRevisionActionState);
  const canSubmit = status === "DRAFT" && ["DESIGNER", "ADMIN"].includes(role);
  const canReview = status === "IN_REVIEW" && ["REVIEWER", "ADMIN"].includes(role);
  const canIssue = status === "APPROVED" && ["REVIEWER", "ADMIN"].includes(role);
  const canAcknowledge = status === "ISSUED" && ["PRODUCTION", "ADMIN"].includes(role);
  const canClose = canAcknowledge && (acknowledgementCount > 0 || ackState.ok);
  const noAction = !canSubmit && !canReview && !canIssue && !canAcknowledge;

  return (
    <section className="rounded-lg border bg-card p-5"><div className="mb-4"><h2 className="text-base font-semibold">Release controls</h2><p className="text-sm text-muted-foreground">Available actions for your role and this revision state.</p></div><div className="space-y-4"><ActionMessage {...transitionState} /><ActionMessage {...ackState} />
      {canSubmit ? <form action={transitionAction}><input type="hidden" name="revisionId" value={revisionId} /><input type="hidden" name="target" value="IN_REVIEW" /><Button type="submit" disabled={transitionPending}>{transitionPending ? <LoaderCircle className="animate-spin" /> : null}Submit for independent review</Button></form> : null}
      {canReview ? <div className="space-y-4">{userId === createdById ? <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">The creator/approver separation rule prevents you from approving this revision.</p> : null}<form action={transitionAction} className="space-y-2"><input type="hidden" name="revisionId" value={revisionId} /><input type="hidden" name="target" value="APPROVED" /><Label htmlFor="approve-comment">Approval comment</Label><Textarea id="approve-comment" name="comment" rows={3} placeholder="Record the checked interfaces, impacts, and controls." required /><Button type="submit" disabled={transitionPending || userId === createdById}>Approve revision</Button></form><form action={transitionAction} className="space-y-2 border-t pt-4"><input type="hidden" name="revisionId" value={revisionId} /><input type="hidden" name="target" value="DRAFT" /><Label htmlFor="reject-comment">Return comment</Label><Textarea id="reject-comment" name="comment" rows={3} placeholder="State the correction required before resubmission." required /><Button type="submit" variant="outline" disabled={transitionPending}>Return to draft</Button></form></div> : null}
      {canIssue ? <form action={transitionAction}><input type="hidden" name="revisionId" value={revisionId} /><input type="hidden" name="target" value="ISSUED" /><Button type="submit" disabled={transitionPending}>Issue controlled revision</Button><p className="mt-2 text-xs text-muted-foreground">Requires an approval record and effective date.</p></form> : null}
      {canAcknowledge ? <div className="space-y-4"><form action={ackAction} className="space-y-2"><input type="hidden" name="revisionId" value={revisionId} /><Label htmlFor="ack-note">Field acknowledgement note</Label><Textarea id="ack-note" name="note" rows={3} placeholder="Confirm the work package and production team received the issued revision." /><Button type="submit" variant="secondary" disabled={ackPending}>{ackPending ? <LoaderCircle className="animate-spin" /> : null}Record acknowledgement</Button></form>{canClose ? <form action={transitionAction} className="border-t pt-4"><input type="hidden" name="revisionId" value={revisionId} /><input type="hidden" name="target" value="CLOSED" /><Button type="submit" disabled={transitionPending}>Close revision control</Button></form> : <p className="text-xs text-muted-foreground">Record at least one production acknowledgement before closing.</p>}</div> : null}
      {noAction ? <p className="text-sm text-muted-foreground">No state-changing action is available for this role. You can still inspect the complete control record.</p> : null}
    </div></section>
  );
}
