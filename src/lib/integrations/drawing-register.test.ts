import { describe, expect, it } from "vitest";
import { parseDrawingRegisterCsv } from "@/lib/integrations/drawing-register";

describe("parseDrawingRegisterCsv", () => {
  it("normalizes a valid synthetic drawing row", () => {
    const result = parseDrawingRegisterCsv(
      "number,title,block,zone,discipline,status\ndemo-2401-b01-st-900,Deck insert,B01,Z1,structure,active",
    );
    expect(result.errors).toEqual([]);
    expect(result.rows[0]).toMatchObject({
      number: "DEMO-2401-B01-ST-900",
      discipline: "STRUCTURE",
      status: "ACTIVE",
    });
  });

  it("rejects production-looking drawing identifiers", () => {
    const result = parseDrawingRegisterCsv(
      "number,title,block,zone,discipline\n2401-B01-ST-900,Deck insert,B01,Z1,STRUCTURE",
    );
    expect(result.rows).toHaveLength(0);
    expect(result.errors[0].message).toContain("DEMO-");
  });

  it("reports missing columns and unsupported disciplines", () => {
    const missing = parseDrawingRegisterCsv("number,title\nDEMO-1,Example");
    expect(missing.errors[0].message).toContain("Missing required columns");

    const invalid = parseDrawingRegisterCsv(
      "number,title,block,zone,discipline\nDEMO-1,Example,B01,Z1,NAVAL_ARCHITECTURE",
    );
    expect(invalid.rows).toHaveLength(0);
    expect(invalid.errors[0].row).toBe(2);
  });
});
