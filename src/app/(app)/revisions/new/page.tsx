import { PageHeader } from "@/components/page-header";
import { RevisionForm } from "@/components/revision-form";
import { requireCurrentUser } from "@/data/auth";
import { getRevisionFormOptions } from "@/data/revisions";
import { redirect } from "next/navigation";

export default async function NewRevisionPage({ searchParams }: { searchParams: Promise<{ drawing?: string }> }) {
  const user = await requireCurrentUser();
  if (!(["DESIGNER", "ADMIN"] as string[]).includes(user.role)) redirect("/drawings");
  const [options, query] = await Promise.all([getRevisionFormOptions(), searchParams]);
  return <div className="space-y-7"><PageHeader eyebrow="Controlled change" title="Create drawing revision" description="Define the change, register downstream impact, and prepare the draft for independent review." /><RevisionForm options={options} defaultDrawingId={query.drawing} defaultOwnerId={user.id} /></div>;
}
