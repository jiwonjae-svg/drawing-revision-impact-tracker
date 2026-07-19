import { Check, Database, KeyRound, LockKeyhole, Minus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getDemoUsers } from "@/data/audit";
import { roleCapabilities, userRoles } from "@/lib/domain/revision-workflow";
import { roleLabels } from "@/lib/format";

const workflow = [
  { from: "Draft", to: "In review", gate: "Summary, impact evidence, and high-risk mitigation" },
  { from: "In review", to: "Approved", gate: "Independent reviewer; creator cannot self-approve" },
  { from: "Approved", to: "Issued", gate: "Approval record and effective date" },
  { from: "Issued", to: "Closed", gate: "Production acknowledgement" },
];

const securityControls = [
  { icon: LockKeyhole, title: "Project-scoped authorization", detail: "Every read and mutation is restricted by project membership and project-specific role." },
  { icon: Database, title: "Append-only audit records", detail: "A PostgreSQL trigger rejects UPDATE and DELETE operations outside the controlled seed bypass." },
  { icon: KeyRound, title: "Approved-member SSO", detail: "Optional Google and GitHub SSO only accepts identities already present in the membership directory." },
];

export default async function SettingsPage() {
  const users = await getDemoUsers();
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Control model" title="Workflow settings" description="Read-only portfolio view of release gates, authorization controls, and synthetic demo memberships." />
      <section>
        <div className="mb-3"><h2 className="text-base font-semibold">Release path</h2><p className="text-sm text-muted-foreground">Mandatory state transitions and readiness gates</p></div>
        <div className="grid gap-3 lg:grid-cols-4">{workflow.map((step) => <div key={step.from} className="rounded-lg border bg-card p-4"><div className="flex items-center gap-2 text-sm font-semibold"><span>{step.from}</span><span className="text-muted-foreground">→</span><span>{step.to}</span></div><p className="mt-3 text-sm leading-5 text-muted-foreground">{step.gate}</p></div>)}</div>
      </section>
      <section>
        <div className="mb-3"><h2 className="text-base font-semibold">Security posture</h2><p className="text-sm text-muted-foreground">Defense in depth for portfolio-grade workflow evidence</p></div>
        <div className="grid gap-3 lg:grid-cols-3">{securityControls.map((control) => { const Icon = control.icon; return <div key={control.title} className="rounded-lg border bg-card p-4"><Icon className="size-4 text-primary" /><h3 className="mt-3 text-sm font-semibold">{control.title}</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">{control.detail}</p></div>; })}</div>
      </section>
      <section>
        <div className="mb-3"><h2 className="text-base font-semibold">Role capability matrix</h2><p className="text-sm text-muted-foreground">Authorization is checked again inside every server-side mutation.</p></div>
        <div className="overflow-hidden rounded-lg border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-muted/60 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Role</th><th className="px-4 py-3 font-medium">Create</th><th className="px-4 py-3 font-medium">Review</th><th className="px-4 py-3 font-medium">Issue</th><th className="px-4 py-3 font-medium">Acknowledge</th><th className="px-4 py-3 font-medium">Primary responsibilities</th></tr></thead><tbody className="divide-y">{userRoles.map((role) => { const flags = { create: ["DESIGNER", "ADMIN"].includes(role), review: ["REVIEWER", "ADMIN"].includes(role), issue: ["REVIEWER", "ADMIN"].includes(role), acknowledge: ["PRODUCTION", "ADMIN"].includes(role) }; return <tr key={role}><td className="px-4 py-3 font-semibold">{roleLabels[role]}</td>{Object.values(flags).map((enabled, index) => <td key={index} className="px-4 py-3">{enabled ? <Check className="size-4 text-emerald-700" /> : <Minus className="size-4 text-muted-foreground" />}</td>)}<td className="px-4 py-3 text-muted-foreground">{roleCapabilities[role].join(" · ")}</td></tr>; })}</tbody></table></div></div>
      </section>
      <section>
        <div className="mb-3"><h2 className="text-base font-semibold">Synthetic demo memberships</h2><p className="text-sm text-muted-foreground">Viewer access is intentionally limited to one project so project isolation can be verified.</p></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{users.map((user) => <div key={user.id} className="rounded-lg border bg-card p-4"><p className="text-sm font-semibold">{user.name}</p><p className="mt-1 text-xs text-muted-foreground">{user.email}</p><p className="mt-3 text-xs font-semibold uppercase text-primary">{roleLabels[user.role]}</p><p className="mt-2 text-xs text-muted-foreground">{user.projectMemberships.map((membership) => `${membership.project.code}: ${roleLabels[membership.role]}`).join(" · ")}</p></div>)}</div>
      </section>
    </div>
  );
}
