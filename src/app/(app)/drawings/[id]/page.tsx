import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RiskBadge, StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { getDrawing } from "@/data/drawings";
import { requireCurrentUser } from "@/data/auth";
import { disciplineLabels, formatDate } from "@/lib/format";

export default async function DrawingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [drawing, user] = await Promise.all([getDrawing(id), requireCurrentUser()]);
  if (!drawing) notFound();
  return (
    <div className="space-y-6">
      <Link href="/drawings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Drawing register</Link>
      <PageHeader eyebrow={`${drawing.project.code} · ${drawing.block} · ${drawing.zone}`} title={drawing.number} description={drawing.title} actions={(["DESIGNER", "ADMIN"] as string[]).includes(user.role) ? <Link href={`/revisions/new?drawing=${drawing.id}`} className={buttonVariants()}><Plus /> New revision</Link> : undefined} />
      <dl className="grid overflow-hidden rounded-lg border bg-card sm:grid-cols-2 lg:grid-cols-4"><div className="p-4"><dt className="text-xs text-muted-foreground">Project</dt><dd className="mt-1 text-sm font-medium">{drawing.project.name}</dd></div><div className="border-t p-4 sm:border-t-0 sm:border-l"><dt className="text-xs text-muted-foreground">Discipline</dt><dd className="mt-1 text-sm font-medium">{disciplineLabels[drawing.discipline]}</dd></div><div className="border-t p-4 lg:border-t-0 lg:border-l"><dt className="text-xs text-muted-foreground">Drawing state</dt><dd className="mt-1 text-sm font-medium capitalize">{drawing.status.toLowerCase()}</dd></div><div className="border-t p-4 sm:border-l lg:border-t-0"><dt className="text-xs text-muted-foreground">Last register update</dt><dd className="mt-1 text-sm font-medium">{formatDate(drawing.updatedAt)}</dd></div></dl>
      <section><div className="mb-3"><h2 className="text-base font-semibold">Revision history</h2><p className="text-sm text-muted-foreground">Newest controlled revision first</p></div><div className="overflow-hidden rounded-lg border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[880px] text-sm"><thead className="bg-muted/60 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Revision</th><th className="px-4 py-3 font-medium">Summary</th><th className="px-4 py-3 font-medium">State</th><th className="px-4 py-3 font-medium">Risk</th><th className="px-4 py-3 font-medium">Owner</th><th className="px-4 py-3 font-medium">Controls</th><th className="px-4 py-3 font-medium">Effective</th></tr></thead><tbody className="divide-y">{drawing.revisions.map((revision) => <tr key={revision.id} className="hover:bg-muted/30"><td className="px-4 py-3"><Link href={`/revisions/${revision.id}`} className="font-mono font-semibold text-primary hover:underline">{revision.revisionCode}</Link></td><td className="max-w-lg px-4 py-3"><p className="line-clamp-2">{revision.summary}</p></td><td className="px-4 py-3"><StatusBadge status={revision.status} /></td><td className="px-4 py-3"><RiskBadge risk={revision.riskLevel} /></td><td className="px-4 py-3 whitespace-nowrap">{revision.owner.name}</td><td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">{revision._count.impacts} impacts · {revision._count.reviews} reviews</td><td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(revision.effectiveDate)}</td></tr>)}</tbody></table></div></div></section>
    </div>
  );
}

