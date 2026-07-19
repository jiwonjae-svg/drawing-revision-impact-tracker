"use client";

import { useActionState } from "react";
import { BellRing, LoaderCircle } from "lucide-react";
import { dispatchNotificationsAction } from "@/app/actions/integrations";
import { Button } from "@/components/ui/button";

const initialState = { ok: false, message: "" };

export function NotificationDispatchForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(dispatchNotificationsAction, initialState);
  return <form action={action} className="space-y-2"><input type="hidden" name="projectId" value={projectId} />{state.message ? <p role="status" className={state.ok ? "text-xs text-emerald-700" : "text-xs text-destructive"}>{state.message}</p> : null}<Button type="submit" variant="outline" size="sm" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : <BellRing />}Dispatch queue</Button></form>;
}
