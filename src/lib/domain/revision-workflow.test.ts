import { describe, expect, it } from "vitest";
import { evaluateTransition, type WorkflowRevision } from "./revision-workflow";

const readyDraft: WorkflowRevision = {
  status: "DRAFT",
  riskLevel: "MEDIUM",
  summary: "Bracket position updated for weld access.",
  impactCount: 2,
  ownerId: "designer",
  createdById: "designer",
  approvalCount: 0,
  acknowledgementCount: 0,
};

describe("revision workflow", () => {
  it("allows a designer to submit a complete draft", () => {
    expect(
      evaluateTransition(
        { id: "designer", role: "DESIGNER" },
        readyDraft,
        "IN_REVIEW",
      ),
    ).toEqual({ allowed: true, reasons: [] });
  });

  it("blocks a high-risk draft without mitigation", () => {
    const result = evaluateTransition(
      { id: "designer", role: "DESIGNER" },
      { ...readyDraft, riskLevel: "HIGH", mitigation: "" },
      "IN_REVIEW",
    );
    expect(result.allowed).toBe(false);
    expect(result.reasons).toContain("고위험 개정에는 완화 조치가 필요합니다.");
  });

  it("blocks another designer from submitting someone else's draft", () => {
    const result = evaluateTransition(
      { id: "other-designer", role: "DESIGNER" },
      readyDraft,
      "IN_REVIEW",
    );
    expect(result.allowed).toBe(false);
    expect(result.reasons[0]).toMatch(/작성자/);
  });

  it("enforces creator and approver separation", () => {
    const result = evaluateTransition(
      { id: "designer", role: "ADMIN" },
      { ...readyDraft, status: "IN_REVIEW" },
      "APPROVED",
    );
    expect(result.allowed).toBe(false);
    expect(result.reasons).toContain("개정 작성자는 자신의 개정을 승인할 수 없습니다.");
  });

  it("requires approval and an effective date before issue", () => {
    const result = evaluateTransition(
      { id: "reviewer", role: "REVIEWER" },
      { ...readyDraft, status: "APPROVED" },
      "ISSUED",
    );
    expect(result.allowed).toBe(false);
    expect(result.reasons).toHaveLength(2);
  });

  it("requires production acknowledgement before close", () => {
    const result = evaluateTransition(
      { id: "production", role: "PRODUCTION" },
      { ...readyDraft, status: "ISSUED" },
      "CLOSED",
    );
    expect(result.allowed).toBe(false);
    expect(result.reasons[0]).toMatch(/현장 확인/);
  });
});
