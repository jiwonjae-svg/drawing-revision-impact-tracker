import { NextResponse } from "next/server";
import {
  hasValidDemoWebhookSecret,
  MAX_DEMO_WEBHOOK_BYTES,
  parseDemoWebhookPayload,
} from "@/lib/notifications/demo-webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const expectedSecret = process.env.NOTIFICATION_WEBHOOK_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ error: "Demo webhook is not configured." }, { status: 503 });
  }

  if (!hasValidDemoWebhookSecret(request.headers.get("x-drawingflow-webhook-secret"), expectedSecret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_DEMO_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "Payload is too large." }, { status: 413 });
  }

  const parsed = parseDemoWebhookPayload(await request.text());
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.reason === "too_large" ? "Payload is too large." : "Invalid demo event." },
      { status: parsed.reason === "too_large" ? 413 : 400 },
    );
  }

  return new Response(null, { status: 204 });
}
