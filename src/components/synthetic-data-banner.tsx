import { FlaskConical } from "lucide-react";

export function SyntheticDataBanner() {
  return (
    <div className="flex items-center gap-2 border-b border-cyan-950/20 bg-cyan-50 px-4 py-2 text-xs text-cyan-950 sm:px-6">
      <FlaskConical className="size-3.5 shrink-0" aria-hidden="true" />
      <span>Portfolio demonstration. All projects, drawings, people, and audit records are synthetic.</span>
    </div>
  );
}

