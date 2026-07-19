import { z } from "zod";

const pdmDrawingSchema = z.object({
  id: z.string().min(1),
  number: z.string().min(1),
  title: z.string().min(1),
  revision: z.string().min(1),
  changedAt: z.iso.datetime(),
  lifecycleState: z.string().min(1),
});

const pdmPageSchema = z.object({
  items: z.array(pdmDrawingSchema).max(500),
  nextCursor: z.string().nullable().optional(),
});

export type PdmDrawingMetadata = z.infer<typeof pdmDrawingSchema>;
export type PdmSyncPage = z.infer<typeof pdmPageSchema>;

export interface PdmAdapter {
  fetchChangedDrawings(cursor?: string): Promise<PdmSyncPage>;
}

export function parsePdmSyncPage(payload: unknown) {
  return pdmPageSchema.parse(payload);
}

export class RestPdmAdapter implements PdmAdapter {
  constructor(
    private readonly endpoint: string,
    private readonly accessToken: string,
  ) {}

  async fetchChangedDrawings(cursor?: string) {
    const url = new URL("drawings/changes", this.endpoint);
    if (cursor) url.searchParams.set("cursor", cursor);
    url.searchParams.set("limit", "500");

    const response = await fetch(url, {
      headers: { authorization: `Bearer ${this.accessToken}`, accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`PDM adapter returned ${response.status}.`);
    return parsePdmSyncPage(await response.json());
  }
}
