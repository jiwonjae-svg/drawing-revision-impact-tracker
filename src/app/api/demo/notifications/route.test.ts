import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/demo/notifications/route";

const payload = {
  eventType: "REVISION_ISSUED",
  drawingNumber: "DEMO-AUR-B101-STR-001",
  revisionCode: "C",
  status: "ISSUED",
  actorName: "Demo Reviewer",
  synthetic: true,
};

function request(secret = "route-secret", body: unknown = payload) {
  return new Request("http://localhost/api/demo/notifications", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-drawingflow-webhook-secret": secret,
    },
    body: JSON.stringify(body),
  });
}

describe("demo notification route", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("stays unavailable until a secret is configured", async () => {
    vi.stubEnv("NOTIFICATION_WEBHOOK_SECRET", "");
    expect((await POST(request())).status).toBe(503);
  });

  it("rejects an invalid shared secret", async () => {
    vi.stubEnv("NOTIFICATION_WEBHOOK_SECRET", "route-secret");
    expect((await POST(request("wrong-secret"))).status).toBe(401);
  });

  it("accepts a valid synthetic event without a response body", async () => {
    vi.stubEnv("NOTIFICATION_WEBHOOK_SECRET", "route-secret");
    const response = await POST(request());
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
  });

  it("rejects events that claim to contain non-synthetic data", async () => {
    vi.stubEnv("NOTIFICATION_WEBHOOK_SECRET", "route-secret");
    expect((await POST(request("route-secret", { ...payload, synthetic: false }))).status).toBe(400);
  });
});
