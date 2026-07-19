import "dotenv/config";

async function main() {
  const endpoint = process.env.NOTIFICATION_WEBHOOK_URL;
  const secret = process.env.NOTIFICATION_WEBHOOK_SECRET;

  if (!endpoint || !secret) {
    throw new Error("NOTIFICATION_WEBHOOK_URL and NOTIFICATION_WEBHOOK_SECRET are required.");
  }

  const payload = JSON.stringify({
    eventType: "REVISION_ISSUED",
    drawingNumber: "DEMO-AUR-B101-STR-001",
    revisionCode: "C",
    status: "ISSUED",
    actorName: "Production Verification",
    synthetic: true,
  });

  const unauthorized = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
  });
  if (unauthorized.status !== 401) {
    throw new Error(`Unsigned request returned ${unauthorized.status}, expected 401.`);
  }

  const authorized = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-drawingflow-webhook-secret": secret,
    },
    body: payload,
  });
  if (authorized.status !== 204) {
    throw new Error(`Signed request returned ${authorized.status}, expected 204.`);
  }

  console.log("Production webhook verified: unsigned=401, signed=204.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Production webhook verification failed.");
  process.exitCode = 1;
});
