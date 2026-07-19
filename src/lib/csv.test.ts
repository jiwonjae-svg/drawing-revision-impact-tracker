import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("escapes commas, quotes, and line breaks", () => {
    expect(toCsv(["Drawing", "Summary"], [["DEMO-001", 'Plate, 6"\nupdated']])).toBe(
      'Drawing,Summary\r\nDEMO-001,"Plate, 6""\nupdated"',
    );
  });
});

