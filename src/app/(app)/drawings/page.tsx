import Link from "next/link";
import { Download, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RiskBadge, StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDrawingFilterOptions, getDrawings } from "@/data/drawings";
import { requireCurrentUser } from "@/data/auth";
import { disciplineLabels, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DrawingsPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const filters = { q: typeof raw.q === "string" ? raw.q : undefined, project: typeof raw.project === "string" ? raw.project : undefined, discipline: typeof raw.discipline === "string" ? raw.discipline : undefined, status: typeof raw.status === "string" ? raw.status : undefined, sort: typeof raw.sort === "string" ? raw.sort : undefined };
  const [drawings, options, user] = await Promise.all([getDrawings(filters), getDrawingFilterOptions(), requireCurrentUser()]);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Controlled register" title="Drawing register" description="Search active and superseded drawings, inspect the latest controlled revision, and export the register for review." actions={<><a href="/api/drawings/export" className={cn(buttonVariants({ variant: "outline" }))}><Download /> Export CSV</a>{(["DESIGNER", "ADMIN"] as string[]).includes(user.role) ? <Link href="/revisions/new" className={buttonVariants()}><Plus /> New revision</Link> : null}</>} />
      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[minmax(220px,1fr)_repeat(4,minmax(130px,auto))_auto]">
        <div className="relative"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input name="q" defaultValue={filters.q} placeholder="Drawing, title, or block" className="pl-9" /></div>
        <select name="project" defaultValue={filters.project ?? ""} className="h-8 rounded-lg border bg-background px-2 text-sm"><option value="">All projects</option>{options.projects.map((project) => <option key={project.id} value={project.id}>{project.code}</option>)}</select>
        <select name="discipline" defaultValue={filters.discipline ?? ""} className="h-8 rounded-lg border bg-background px-2 text-sm"><option value="">All disciplines</option>{options.disciplines.map((item) => <option key={item} value={item}>{disciplineLabels[item]}</option>)}</select>
        <select name="status" defaultValue={filters.status ?? ""} className="h-8 rounded-lg border bg-background px-2 text-sm"><option value="">All drawing states</option><option value="ACTIVE">Active</option><option value="SUPERSEDED">Superseded</option><option value="ARCHIVED">Archived</option></select>
        <select name="sort" defaultValue={filters.sort ?? "number"} className="h-8 rounded-lg border bg-background px-2 text-sm"><option value="number">Sort: drawing no.</option><option value="updated">Sort: updated</option><option value="block">Sort: block</option></select>
        <button type="submit" className={buttonVariants({ variant: "secondary" })}>Apply</button>
      </form>
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-sm"><thead className="bg-muted/60 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Drawing</th><th className="px-4 py-3 font-medium">Project / location</th><th className="px-4 py-3 font-medium">Discipline</th><th className="px-4 py-3 font-medium">Latest revision</th><th className="px-4 py-3 font-medium">Risk</th><th className="px-4 py-3 font-medium">Updated</th></tr></thead><tbody className="divide-y">{drawings.map((drawing) => { const latest = drawing.revisions[0]; return <tr key={drawing.id} className="hover:bg-muted/30"><td className="px-4 py-3"><Link href={`/drawings/${drawing.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{drawing.number}</Link><p className="mt-1 max-w-md truncate">{drawing.title}</p></td><td className="px-4 py-3"><p className="font-medium">{drawing.project.code}</p><p className="text-xs text-muted-foreground">{drawing.block} · {drawing.zone}</p></td><td className="px-4 py-3">{disciplineLabels[drawing.discipline]}</td><td className="px-4 py-3">{latest ? <div className="flex items-center gap-2"><span className="font-mono font-semibold">{latest.revisionCode}</span><StatusBadge status={latest.status} /></div> : <span className="text-muted-foreground">None</span>}</td><td className="px-4 py-3">{latest ? <RiskBadge risk={latest.riskLevel} /> : "—"}</td><td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(drawing.updatedAt)}</td></tr>; })}</tbody></table></div>
        <div className="border-t px-4 py-3 text-xs text-muted-foreground">Showing {drawings.length} controlled drawings</div>
      </div>
    </div>
  );
}

