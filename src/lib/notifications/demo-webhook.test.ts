import { describe, expect, it } from "vitest";
import {
  hasValidDemoWebhookSecret,
  MAX_DEMO_WEBHOOK_BYTES,
  parseDemoWebhookPayload,
} from "@/lib/notifications/demo-webhook";

const validPayload = {
  eventType: "REVISION_ISSUED",
  drawingNumber: "DEMO-AUR-B101-STR-001",
  revisionCode: "C",
  status: "ISSUED",
  actorName: "Demo Reviewer",
  synthetic: true,
};

describe("demo webhook boundary", () => {
  it("accepts only the configured shared secret", () => {
    expect(hasValidDemoWebhookSecret("shared-secret", "shared-secret")).toBe(true);
    expect(hasValidDemoWebhookSecret("wrong-secret", "shared-secret")).toBe(false);
    expect(hasValidDemoWebhookSecret(null, "shared-secret")).toBe(false);
  });

  it("accepts a strict synthetic DrawingFlow event", () => {
    const result = parseDemoWebhookPayload(JSON.stringify(validPayload));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.status).toBe("ISSUED");
  });

  it("rejects real-data claims and unexpected fields", () => {
    expect(parseDemoWebhookPayload(JSON.stringify({ ...validPayload, synthetic: false })).ok).toBe(false);
    expect(parseDemoWebhookPayload(JSON.stringify({ ...validPayload, customerName: "Private Yard" })).ok).toBe(false);
  });

  it("rejects invalid JSON and oversized requests", () => {
    expect(parseDemoWebhookPayload("not-json")).toEqual({ ok: false, reason: "invalid_json" });
    expect(parseDemoWebhookPayload(`{"padding":"${"x".repeat(MAX_DEMO_WEBHOOK_BYTES)}"}`)).toEqual({
      ok: false,
      reason: "too_large",
    });
  });
});
