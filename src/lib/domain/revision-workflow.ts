export const revisionStatuses = [
  "DRAFT",
  "IN_REVIEW",
  "APPROVED",
  "ISSUED",
  "CLOSED",
] as const;

export const userRoles = [
  "DESIGNER",
  "REVIEWER",
  "PRODUCTION",
  "ADMIN",
  "VIEWER",
] as const;

export const riskLevels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export type RevisionStatusValue = (typeof revisionStatuses)[number];
export type UserRoleValue = (typeof userRoles)[number];
export type RiskLevelValue = (typeof riskLevels)[number];

export type WorkflowActor = {
  id: string;
  role: UserRoleValue;
};

export type WorkflowRevision = {
  status: RevisionStatusValue;
  riskLevel: RiskLevelValue;
  summary: string;
  impactCount: number;
  mitigation?: string | null;
  ownerId?: string | null;
  effectiveDate?: Date | string | null;
  createdById: string;
  approvalCount: number;
  acknowledgementCount: number;
};

export type WorkflowDecision = {
  allowed: boolean;
  reasons: string[];
};

const transitionRoles: Record<string, UserRoleValue[]> = {
  "DRAFT:IN_REVIEW": ["DESIGNER", "ADMIN"],
  "IN_REVIEW:APPROVED": ["REVIEWER", "ADMIN"],
  "IN_REVIEW:DRAFT": ["REVIEWER", "ADMIN"],
  "APPROVED:ISSUED": ["REVIEWER", "ADMIN"],
  "ISSUED:CLOSED": ["PRODUCTION", "ADMIN"],
};

export function evaluateTransition(
  actor: WorkflowActor,
  revision: WorkflowRevision,
  target: RevisionStatusValue,
): WorkflowDecision {
  const reasons: string[] = [];
  const key = `${revision.status}:${target}`;
  const allowedRoles = transitionRoles[key];

  if (!allowedRoles) {
    reasons.push(`${revision.status}에서 ${target}(으)로 이동할 수 없습니다.`);
    return { allowed: false, reasons };
  }

  if (!allowedRoles.includes(actor.role)) {
    reasons.push(`${actor.role} 역할에는 이 상태 변경 권한이 없습니다.`);
  }

  if (revision.status === "DRAFT" && target === "IN_REVIEW") {
    if (actor.role !== "ADMIN" && actor.id !== revision.createdById) {
      reasons.push("개정 작성자 또는 관리자만 초안을 검토 요청할 수 있습니다.");
    }
    if (!revision.summary.trim()) {
      reasons.push("검토 요청 전에 변경 요약을 입력해야 합니다.");
    }
    if (revision.impactCount < 1) {
      reasons.push("검토 요청 전에 영향 항목을 한 개 이상 등록해야 합니다.");
    }
    if (["HIGH", "CRITICAL"].includes(revision.riskLevel)) {
      if (!revision.mitigation?.trim()) {
        reasons.push("고위험 개정에는 완화 조치가 필요합니다.");
      }
      if (!revision.ownerId) {
        reasons.push("고위험 개정에는 책임자가 필요합니다.");
      }
    }
  }

  if (revision.status === "IN_REVIEW" && target === "APPROVED") {
    if (actor.id === revision.createdById) {
      reasons.push("개정 작성자는 자신의 개정을 승인할 수 없습니다.");
    }
  }

  if (revision.status === "APPROVED" && target === "ISSUED") {
    if (revision.approvalCount < 1) {
      reasons.push("발행 전에 승인 기록이 필요합니다.");
    }
    if (!revision.effectiveDate) {
      reasons.push("발행 전에 적용일을 지정해야 합니다.");
    }
  }

  if (revision.status === "ISSUED" && target === "CLOSED") {
    if (revision.acknowledgementCount < 1) {
      reasons.push("종결 전에 생산 담당자의 현장 확인이 필요합니다.");
    }
  }

  return { allowed: reasons.length === 0, reasons };
}

export function canEditDraft(
  actor: WorkflowActor,
  revision: Pick<WorkflowRevision, "status" | "createdById">,
) {
  return (
    revision.status === "DRAFT" &&
    (actor.role === "ADMIN" || actor.id === revision.createdById)
  );
}

export const roleCapabilities: Record<UserRoleValue, string[]> = {
  DESIGNER: ["개정 작성", "영향 분석", "검토 요청"],
  REVIEWER: ["기술 검토", "승인 또는 반려", "발행"],
  PRODUCTION: ["발행본 확인", "현장 반영 확인", "종결 요청"],
  ADMIN: ["전체 워크플로 관리", "감사 로그 열람", "상태 복구"],
  VIEWER: ["도면·개정 읽기", "감사 이력 읽기"],
};
