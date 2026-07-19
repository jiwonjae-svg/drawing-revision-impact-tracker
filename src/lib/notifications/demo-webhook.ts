import { timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const MAX_DEMO_WEBHOOK_BYTES = 16 * 1024;

export const demoWebhookPayloadSchema = z.object({
  eventType: z.string().min(1).max(100),
  drawingNumber: z.string().min(1).max(80),
  revisionCode: z.string().min(1).max(40),
  status: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "ISSUED", "CLOSED"]),
  actorName: z.string().min(1).max(120),
  synthetic: z.literal(true),
}).strict();

export type DemoWebhookPayload = z.infer<typeof demoWebhookPayloadSchema>;

export function hasValidDemoWebhookSecret(provided: string | null, expected: string) {
  if (!provided || !expected) return false;

  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  return providedBytes.length === expectedBytes.length
    && timingSafeEqual(providedBytes, expectedBytes);
}

export function parseDemoWebhookPayload(rawBody: string) {
  if (Buffer.byteLength(rawBody, "utf8") > MAX_DEMO_WEBHOOK_BYTES) {
    return { ok: false as const, reason: "too_large" as const };
  }

  try {
    const json: unknown = JSON.parse(rawBody);
    const parsed = demoWebhookPayloadSchema.safeParse(json);
    return parsed.success
      ? { ok: true as const, data: parsed.data }
      : { ok: false as const, reason: "invalid_payload" as const };
  } catch {
    return { ok: false as const, reason: "invalid_json" as const };
  }
}
