import type {
  RevisionStatusValue,
  RiskLevelValue,
  UserRoleValue,
} from "@/lib/domain/revision-workflow";

export const statusLabels: Record<RevisionStatusValue, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  APPROVED: "Approved",
  ISSUED: "Issued",
  CLOSED: "Closed",
};

export const riskLabels: Record<RiskLevelValue, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const roleLabels: Record<UserRoleValue, string> = {
  DESIGNER: "Designer",
  REVIEWER: "Reviewer",
  PRODUCTION: "Production",
  ADMIN: "Admin",
  VIEWER: "Viewer",
};

export const disciplineLabels: Record<string, string> = {
  STRUCTURE: "Structure",
  OUTFITTING: "Outfitting",
  PIPING: "Piping",
  ELECTRICAL: "Electrical",
  HVAC: "HVAC",
};

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

export function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

