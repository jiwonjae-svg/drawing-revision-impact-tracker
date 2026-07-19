import Link from "next/link";
import { AlertTriangle, ArrowRight, ClipboardCheck, FileStack, ShieldAlert, TimerReset } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RiskBadge, StatusBadge } from "@/components/status-badge";
import { Progress } from "@/components/ui/progress";
import { buttonVariants } from "@/components/ui/button";
import { getDashboardData } from "@/data/dashboard";
import { requireCurrentUser } from "@/data/auth";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusOrder = ["DRAFT", "IN_REVIEW", "APPROVED", "ISSUED", "CLOSED"] as const;

export default async function DashboardPage() {
  const [data, user] = await Promise.all([getDashboardData(), requireCurrentUser()]);
  const metrics = [
    { label: "Active drawings", value: data.metrics.drawings, icon: FileStack, hint: "Controlled register" },
    { label: "In review", value: data.metrics.reviewQueue, icon: ClipboardCheck, hint: "Awaiting decision" },
    { label: "High-risk open", value: data.metrics.openHighRisk, icon: ShieldAlert, hint: "High + critical" },
    { label: "Overdue", value: data.metrics.overdue, icon: TimerReset, hint: "Before issue" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Command dashboard" title="Revision control overview" description={`Signed in as ${user.name}. Monitor design changes, review gates, and production acknowledgement across synthetic vessel projects.`} actions={(["DESIGNER", "ADMIN"] as string[]).includes(user.role) ? <Link href="/revisions/new" className={buttonVariants()}>Create revision</Link> : undefined} />

      <section aria-label="Workflow metrics" className="grid overflow-hidden rounded-lg border bg-card sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => { const Icon = metric.icon; return (
          <div key={metric.label} className={cn("flex min-h-28 items-center gap-4 p-5", index > 0 && "border-t sm:border-t-0 sm:border-l", index === 2 && "sm:border-l-0 sm:border-t xl:border-l xl:border-t-0")}>
            <div className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground"><Icon className="size-5" /></div>
            <div><p className="text-2xl font-semibold tabular-nums">{metric.value}</p><p className="text-sm font-medium">{metric.label}</p><p className="text-xs text-muted-foreground">{metric.hint}</p></div>
          </div>
        ); })}
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.4fr_1fr]">
        <section>
          <div className="mb-3 flex items-end justify-between"><div><h2 className="text-base font-semibold">Priority review queue</h2><p className="text-sm text-muted-foreground">Ordered by risk and due date</p></div><Link href="/review-queue" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">Open queue <ArrowRight className="size-3.5" /></Link></div>
          <div className="overflow-hidden rounded-lg border bg-card">
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/55 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Drawing</th><th className="px-4 py-3 font-medium">Risk</th><th className="px-4 py-3 font-medium">Owner</th><th className="px-4 py-3 font-medium">Due</th></tr></thead><tbody className="divide-y">
              {data.reviewQueue.map((revision) => <tr key={revision.id} className="hover:bg-muted/30"><td className="px-4 py-3"><Link href={`/revisions/${revision.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{revision.drawing.number} / {revision.revisionCode}</Link><p className="mt-1 max-w-sm truncate text-xs text-muted-foreground">{revision.drawing.title}</p></td><td className="px-4 py-3"><RiskBadge risk={revision.riskLevel} /></td><td className="px-4 py-3 whitespace-nowrap">{revision.owner.name}</td><td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(revision.dueDate)}</td></tr>)}
            </tbody></table></div>
            {data.reviewQueue.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No revisions are waiting for review.</p> : null}
          </div>
        </section>

        <section>
          <div className="mb-3"><h2 className="text-base font-semibold">Workflow distribution</h2><p className="text-sm text-muted-foreground">All 50 synthetic revision records</p></div>
          <div className="rounded-lg border bg-card p-5">
            <div className="space-y-4">{statusOrder.map((status) => { const count = data.statusCounts[status] ?? 0; const percent = data.metrics.openRevisions + (data.statusCounts.CLOSED ?? 0) ? Math.round((count / (data.metrics.openRevisions + (data.statusCounts.CLOSED ?? 0))) * 100) : 0; return <div key={status}><div className="mb-1.5 flex items-center justify-between"><StatusBadge status={status} /><span className="text-sm font-semibold tabular-nums">{count}</span></div><Progress value={percent} /></div>; })}</div>
          </div>
        </section>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.4fr_1fr]">
        <section>
          <div className="mb-3 flex items-center gap-2"><AlertTriangle className="size-4 text-orange-600" /><div><h2 className="text-base font-semibold">Open risk controls</h2><p className="text-sm text-muted-foreground">High and critical revisions not yet closed</p></div></div>
          <div className="divide-y rounded-lg border bg-card">{data.highRisk.map((revision) => <Link key={revision.id} href={`/revisions/${revision.id}`} className="grid gap-2 px-4 py-3 hover:bg-muted/30 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="font-mono text-xs font-semibold text-primary">{revision.drawing.number} / {revision.revisionCode}</p><p className="mt-1 text-sm">{revision.drawing.title}</p></div><RiskBadge risk={revision.riskLevel} /><StatusBadge status={revision.status} /></Link>)}</div>
        </section>
        <section>
          <div className="mb-3"><h2 className="text-base font-semibold">Recent control activity</h2><p className="text-sm text-muted-foreground">Append-only application audit events</p></div>
          <div className="divide-y rounded-lg border bg-card">{data.recentEvents.map((event) => <div key={event.id} className="px-4 py-3"><p className="text-sm font-medium">{event.action.replaceAll("_", " ").toLowerCase()}</p><p className="mt-1 text-xs text-muted-foreground">{event.actor?.name ?? "System"} · {event.drawing?.number ?? event.entityType} · {formatDateTime(event.createdAt)}</p></div>)}</div>
        </section>
      </div>

      <section><div className="mb-3"><h2 className="text-base font-semibold">Project readiness</h2><p className="text-sm text-muted-foreground">Closed revision ratio by synthetic vessel project</p></div><div className="grid gap-4 lg:grid-cols-2">{data.projects.map((project) => <div key={project.id} className="rounded-lg border bg-card p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs font-semibold text-primary">{project.code}</p><h3 className="mt-1 font-semibold">{project.name}</h3><p className="text-sm text-muted-foreground">{project.vesselType}</p></div><span className="text-xl font-semibold tabular-nums">{project.completion}%</span></div><Progress value={project.completion} className="mt-5" /><p className="mt-2 text-xs text-muted-foreground">{project.drawingCount} drawings · {project.revisionCount} revisions</p></div>)}</div></section>
    </div>
  );
}

