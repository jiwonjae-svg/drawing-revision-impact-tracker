import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { riskLabels, statusLabels } from "@/lib/format";
import type { RevisionStatusValue, RiskLevelValue } from "@/lib/domain/revision-workflow";

const statusStyles: Record<RevisionStatusValue, string> = {
  DRAFT: "border-slate-300 bg-slate-100 text-slate-700",
  IN_REVIEW: "border-amber-300 bg-amber-50 text-amber-800",
  APPROVED: "border-sky-300 bg-sky-50 text-sky-800",
  ISSUED: "border-teal-300 bg-teal-50 text-teal-800",
  CLOSED: "border-emerald-300 bg-emerald-50 text-emerald-800",
};

const riskStyles: Record<RiskLevelValue, string> = {
  LOW: "border-slate-300 bg-white text-slate-600",
  MEDIUM: "border-blue-300 bg-blue-50 text-blue-800",
  HIGH: "border-orange-300 bg-orange-50 text-orange-800",
  CRITICAL: "border-red-300 bg-red-50 text-red-800",
};

export function StatusBadge({ status }: { status: RevisionStatusValue }) {
  return <Badge variant="outline" className={cn("rounded-md", statusStyles[status])}>{statusLabels[status]}</Badge>;
}

export function RiskBadge({ risk }: { risk: RiskLevelValue }) {
  return <Badge variant="outline" className={cn("rounded-md", riskStyles[risk])}>{riskLabels[risk]}</Badge>;
}

