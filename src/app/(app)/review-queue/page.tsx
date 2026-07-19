import Link from "next/link";
import { Clock3 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RiskBadge } from "@/components/status-badge";
import { getReviewQueue } from "@/data/revisions";
import { requireCurrentUser } from "@/data/auth";
import { disciplineLabels, formatDate } from "@/lib/format";

export default async function ReviewQueuePage() {
  const [queue, user] = await Promise.all([getReviewQueue(), requireCurrentUser()]);
  return <div className="space-y-6"><PageHeader eyebrow="Decision gate" title="Review queue" description={`Risk-ordered revisions awaiting an independent technical decision. ${user.role === "REVIEWER" || user.role === "ADMIN" ? "Your current role can approve or return these items." : "Your current role can inspect but not decide these items."}`} /><div className="overflow-hidden rounded-lg border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm"><thead className="bg-muted/60 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Drawing / revision</th><th className="px-4 py-3 font-medium">Change summary</th><th className="px-4 py-3 font-medium">Risk</th><th className="px-4 py-3 font-medium">Impact evidence</th><th className="px-4 py-3 font-medium">Owner</th><th className="px-4 py-3 font-medium">Due</th></tr></thead><tbody className="divide-y">{queue.map((revision) => <tr key={revision.id} className="hover:bg-muted/30"><td className="px-4 py-3"><Link href={`/revisions/${revision.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{revision.drawing.number} / {revision.revisionCode}</Link><p className="mt-1 text-xs text-muted-foreground">{revision.drawing.project.code} · {revision.drawing.block} · {disciplineLabels[revision.drawing.discipline]}</p></td><td className="max-w-xl px-4 py-3"><p className="line-clamp-2 leading-5">{revision.summary}</p></td><td className="px-4 py-3"><RiskBadge risk={revision.riskLevel} /></td><td className="px-4 py-3 text-muted-foreground">{revision._count.impacts} impacts · {revision._count.reviews} prior reviews</td><td className="px-4 py-3 whitespace-nowrap">{revision.owner.name}</td><td className="px-4 py-3 whitespace-nowrap"><span className="flex items-center gap-1.5 text-muted-foreground"><Clock3 className="size-3.5" />{formatDate(revision.dueDate)}</span></td></tr>)}</tbody></table></div>{queue.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No revisions are waiting for review.</p> : null}</div></div>;
}

