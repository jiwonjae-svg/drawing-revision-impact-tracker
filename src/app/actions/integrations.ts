"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireActionUser, requireProjectRole } from "@/data/auth";
import { parseDrawingRegisterCsv } from "@/lib/integrations/drawing-register";
import { dispatchPendingNotifications } from "@/lib/notifications/outbox";
import { prisma } from "@/lib/prisma";

export type IntegrationActionState = { ok: boolean; message: string };

const importSchema = z.object({ projectId: z.string().min(1) });

export async function importDrawingRegisterAction(
  _state: IntegrationActionState,
  formData: FormData,
): Promise<IntegrationActionState> {
  const actor = await requireActionUser();
  const parsedInput = importSchema.safeParse(Object.fromEntries(formData));
  const file = formData.get("drawingRegister");
  if (!parsedInput.success || !(file instanceof File) || !file.name.toLowerCase().endsWith(".csv")) {
    return { ok: false, message: "Select a project and a CSV drawing register." };
  }

  try {
    await requireProjectRole(parsedInput.data.projectId, ["DESIGNER", "ADMIN"]);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Project access denied." };
  }

  const [project, source] = await Promise.all([
    prisma.project.findUnique({ where: { id: parsedInput.data.projectId }, select: { code: true } }),
    prisma.integrationSource.findFirst({
      where: { projectId: parsedInput.data.projectId, type: "CSV_IMPORT" },
      select: { id: true },
    }),
  ]);
  if (!project || !source) return { ok: false, message: "CSV integration source is unavailable." };

  const result = parseDrawingRegisterCsv(await file.text());
  const expectedPrefix = `DEMO-${project.code.replace(/^DF-/, "")}-`;
  const rows = result.rows.filter((row) => row.number.startsWith(expectedPrefix));
  const prefixErrors = result.rows.length - rows.length;
  const errors = [
    ...result.errors,
    ...(prefixErrors
      ? [{ row: 0, message: `${prefixErrors} row(s) did not match project prefix ${expectedPrefix}.` }]
      : []),
  ];
  const batch = await prisma.importBatch.create({
    data: {
      sourceId: source.id,
      importedById: actor.id,
      fileName: file.name.slice(0, 200),
      rowCount: rows.length,
      errorCount: errors.length,
      summary: { errors: errors.slice(0, 20) },
    },
  });

  if (!rows.length) {
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: { status: "FAILED", completedAt: new Date() },
    });
    revalidatePath("/integrations");
    return { ok: false, message: errors[0]?.message ?? "No valid drawing rows were found." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const row of rows) {
        await tx.drawing.upsert({
          where: { number: row.number },
          update: {
            title: row.title,
            block: row.block,
            zone: row.zone,
            discipline: row.discipline,
            status: row.status,
          },
          create: { ...row, projectId: parsedInput.data.projectId },
        });
      }
      await tx.importBatch.update({
        where: { id: batch.id },
        data: {
          status: errors.length ? "PARTIAL" : "COMPLETED",
          completedAt: new Date(),
        },
      });
      await tx.integrationSource.update({
        where: { id: source.id },
        data: { lastSyncAt: new Date(), status: errors.length ? "PARTIAL" : "READY" },
      });
      await tx.auditEvent.create({
        data: {
          actorId: actor.id,
          projectId: parsedInput.data.projectId,
          action: "DRAWING_REGISTER_IMPORTED",
          entityType: "ImportBatch",
          entityId: batch.id,
          details: { fileName: file.name, importedRows: rows.length, errorCount: errors.length },
        },
      });
    });
  } catch (error) {
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        summary: { errors: [{ row: 0, message: error instanceof Error ? error.message : "Import failed." }] },
      },
    });
    return { ok: false, message: "Import failed without changing the drawing register." };
  }

  revalidatePath("/integrations");
  revalidatePath("/drawings");
  return {
    ok: true,
    message: `Imported ${rows.length} synthetic drawing row(s)${errors.length ? ` with ${errors.length} warning(s)` : ""}.`,
  };
}

export async function dispatchNotificationsAction(
  _state: IntegrationActionState,
  formData: FormData,
): Promise<IntegrationActionState> {
  const projectId = String(formData.get("projectId") ?? "");
  try {
    await requireProjectRole(projectId, ["ADMIN"]);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Project access denied." };
  }
  const result = await dispatchPendingNotifications(projectId);
  revalidatePath("/integrations");
  if (!result.configured) {
    return { ok: false, message: "Set NOTIFICATION_WEBHOOK_URL before dispatching queued events." };
  }
  return { ok: result.failed === 0, message: `Processed ${result.processed}: ${result.sent} sent, ${result.failed} failed.` };
}
