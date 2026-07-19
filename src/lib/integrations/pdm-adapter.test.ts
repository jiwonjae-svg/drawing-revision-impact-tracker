import { describe, expect, it } from "vitest";
import { parsePdmSyncPage } from "@/lib/integrations/pdm-adapter";

describe("parsePdmSyncPage", () => {
  it("accepts a bounded metadata page", () => {
    const page = parsePdmSyncPage({
      items: [{
        id: "pdm-demo-1",
        number: "DEMO-AUR-B101-STR-001",
        title: "Deck support arrangement",
        revision: "B",
        changedAt: "2026-07-19T08:00:00.000Z",
        lifecycleState: "RELEASED",
      }],
      nextCursor: null,
    });
    expect(page.items[0].revision).toBe("B");
  });

  it("rejects incomplete upstream records", () => {
    expect(() => parsePdmSyncPage({ items: [{ id: "missing-fields" }] })).toThrow();
  });
});
