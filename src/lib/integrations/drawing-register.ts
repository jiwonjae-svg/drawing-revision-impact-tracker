import { parse } from "csv-parse/sync";
import { z } from "zod";

const MAX_CSV_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 500;
const requiredColumns = ["number", "title", "block", "zone", "discipline"] as const;

const rowSchema = z.object({
  number: z.string().trim().min(4).max(80).transform((value) => value.toUpperCase()),
  title: z.string().trim().min(3).max(200),
  block: z.string().trim().min(1).max(30).transform((value) => value.toUpperCase()),
  zone: z.string().trim().min(1).max(30).transform((value) => value.toUpperCase()),
  discipline: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .pipe(z.enum(["STRUCTURE", "OUTFITTING", "PIPING", "ELECTRICAL", "HVAC"])),
  status: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .pipe(z.enum(["ACTIVE", "SUPERSEDED", "ARCHIVED"]))
    .optional()
    .default("ACTIVE"),
});

export type DrawingRegisterRow = z.infer<typeof rowSchema>;
export type DrawingRegisterError = { row: number; message: string };

export function parseDrawingRegisterCsv(input: string) {
  if (Buffer.byteLength(input, "utf8") > MAX_CSV_BYTES) {
    return { rows: [] as DrawingRegisterRow[], errors: [{ row: 0, message: "CSV exceeds 2 MB." }] };
  }

  let records: Record<string, string>[];
  try {
    records = parse(input, {
      bom: true,
      columns: (header: string[]) => header.map((column) => column.trim().toLowerCase()),
      skip_empty_lines: true,
      trim: true,
    });
  } catch (error) {
    return {
      rows: [] as DrawingRegisterRow[],
      errors: [{ row: 0, message: error instanceof Error ? error.message : "CSV could not be parsed." }],
    };
  }

  if (records.length > MAX_ROWS) {
    return { rows: [], errors: [{ row: 0, message: `CSV contains more than ${MAX_ROWS} rows.` }] };
  }
  if (records.length === 0) {
    return { rows: [], errors: [{ row: 0, message: "CSV contains no data rows." }] };
  }

  const columns = Object.keys(records[0]);
  const missing = requiredColumns.filter((column) => !columns.includes(column));
  if (missing.length) {
    return {
      rows: [],
      errors: [{ row: 1, message: `Missing required columns: ${missing.join(", ")}.` }],
    };
  }

  const rows: DrawingRegisterRow[] = [];
  const errors: DrawingRegisterError[] = [];
  records.forEach((record, index) => {
    const parsed = rowSchema.safeParse(record);
    if (!parsed.success) {
      errors.push({
        row: index + 2,
        message: parsed.error.issues.map((issue) => issue.message).join("; "),
      });
      return;
    }
    if (!parsed.data.number.startsWith("DEMO-")) {
      errors.push({ row: index + 2, message: "Drawing number must start with DEMO-." });
      return;
    }
    rows.push(parsed.data);
  });

  return { rows, errors };
}
