import "server-only";
import type { Prisma, RevisionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type NotificationInput = {
  projectId: string;
  revisionId: string;
  eventType: string;
  drawingNumber: string;
  revisionCode: string;
  status: RevisionStatus;
  actorName: string;
};

export function enqueueRevisionNotification(
  tx: Prisma.TransactionClient,
  input: NotificationInput,
) {
  return tx.notificationOutbox.create({
    data: {
      projectId: input.projectId,
      revisionId: input.revisionId,
      eventType: input.eventType,
      payload: {
        eventType: input.eventType,
        drawingNumber: input.drawingNumber,
        revisionCode: input.revisionCode,
        status: input.status,
        actorName: input.actorName,
        synthetic: true,
      },
    },
  });
}

export async function dispatchPendingNotifications(projectId?: string) {
  const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
  const webhookSecret = process.env.NOTIFICATION_WEBHOOK_SECRET;
  if (!webhookUrl) return { processed: 0, sent: 0, failed: 0, configured: false };

  const pending = await prisma.notificationOutbox.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      status: { in: ["PENDING", "FAILED"] },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
    },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  let sent = 0;
  let failed = 0;
  for (const item of pending) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(webhookSecret ? { "x-drawingflow-webhook-secret": webhookSecret } : {}),
        },
        body: JSON.stringify(item.payload),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error(`Webhook returned ${response.status}.`);
      await prisma.notificationOutbox.update({
        where: { id: item.id },
        data: { status: "SENT", sentAt: new Date(), attempts: { increment: 1 }, lastError: null },
      });
      sent += 1;
    } catch (error) {
      await prisma.notificationOutbox.update({
        where: { id: item.id },
        data: {
          status: "FAILED",
          attempts: { increment: 1 },
          lastError: error instanceof Error ? error.message.slice(0, 500) : "Webhook failed.",
          nextAttemptAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });
      failed += 1;
    }
  }

  return { processed: pending.length, sent, failed, configured: true };
}
