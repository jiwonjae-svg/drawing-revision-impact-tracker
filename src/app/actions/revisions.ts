"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActionUser, requireProjectRole } from "@/data/auth";
import {
  evaluateTransition,
  type RevisionStatusValue,
  type UserRoleValue,
} from "@/lib/domain/revision-workflow";
import {
  dispatchPendingNotifications,
  enqueueRevisionNotification,
} from "@/lib/notifications/outbox";
import { prisma } from "@/lib/prisma";

export type RevisionActionState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

const createRevisionSchema = z.object({
  drawingId: z.string().min(1, "Select a drawing."),
  revisionCode: z
    .string()
    .trim()
    .min(1, "Enter a revision code.")
    .max(8)
    .regex(/^[A-Z0-9.-]+$/i, "Use letters, numbers, dots, or hyphens."),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  summary: z.string().trim().min(10, "Describe the change in at least 10 characters."),
  reason: z.string().trim().min(10, "Describe why the change is needed."),
  mitigation: z.string().trim().optional(),
  ownerId: z.string().min(1, "Select an owner."),
  effectiveDate: z.string().min(1, "Set the planned effective date."),
  dueDate: z.string().optional(),
});

const impactSchema = z.object({
  type: z.enum([
    "DRAWING",
    "PROCESS",
    "WORK_PACKAGE",
    "MATERIAL",
    "SCHEDULE",
    "QUALITY",
    "SAFETY",
  ]),
  target: z.string().trim().min(2),
  description: z.string().trim().min(5),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

export async function createRevisionAction(
  _state: RevisionActionState,
  formData: FormData,
): Promise<RevisionActionState> {
  const actor = await requireActionUser();

  const parsed = createRevisionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the required revision fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const types = formData.getAll("impactType").map(String);
  const targets = formData.getAll("impactTarget").map(String);
  const descriptions = formData.getAll("impactDescription").map(String);
  const severities = formData.getAll("impactSeverity").map(String);
  const impacts = types
    .map((type, index) =>
      impactSchema.safeParse({
        type,
        target: targets[index] ?? "",
        description: descriptions[index] ?? "",
        severity: severities[index] ?? "LOW",
      }),
    )
    .filter((result) => result.success)
    .map((result) => result.data);

  if (impacts.length < 1) {
    return {
      ok: false,
      message: "Add at least one complete impact item.",
      errors: { impacts: ["Type, target, description, and severity are required."] },
    };
  }

  if (
    ["HIGH", "CRITICAL"].includes(parsed.data.riskLevel) &&
    !parsed.data.mitigation
  ) {
    return {
      ok: false,
      message: "High and critical revisions require a mitigation plan.",
      errors: { mitigation: ["Describe the hold, verification, or recovery controls."] },
    };
  }

  const drawing = await prisma.drawing.findUnique({
    where: { id: parsed.data.drawingId },
    select: { id: true, number: true, projectId: true },
  });
  if (!drawing) return { ok: false, message: "The selected drawing no longer exists." };

  try {
    await requireProjectRole(drawing.projectId, ["DESIGNER", "ADMIN"]);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Project access denied." };
  }

  const owner = await prisma.projectMembership.findUnique({
    where: {
      projectId_userId: { projectId: drawing.projectId, userId: parsed.data.ownerId },
    },
    select: { role: true },
  });
  if (!owner || !(["DESIGNER", "ADMIN"] as string[]).includes(owner.role)) {
    return { ok: false, message: "Select a designer or admin as the responsible owner." };
  }

  let revision;
  try {
    revision = await prisma.$transaction(async (tx) => {
      const created = await tx.revision.create({
      data: {
        drawingId: drawing.id,
        revisionCode: parsed.data.revisionCode.toUpperCase(),
        riskLevel: parsed.data.riskLevel,
        summary: parsed.data.summary,
        reason: parsed.data.reason,
        mitigation: parsed.data.mitigation || null,
        effectiveDate: parsed.data.effectiveDate
          ? new Date(`${parsed.data.effectiveDate}T00:00:00.000Z`)
          : null,
        dueDate: parsed.data.dueDate
          ? new Date(`${parsed.data.dueDate}T23:59:59.000Z`)
          : null,
        ownerId: parsed.data.ownerId,
        createdById: actor.id,
        impacts: { create: impacts },
      },
    });

      await tx.auditEvent.create({
        data: {
          actorId: actor.id,
          projectId: drawing.projectId,
          drawingId: drawing.id,
          revisionId: created.id,
          action: "REVISION_CREATED",
          entityType: "Revision",
          entityId: created.id,
          details: {
            revisionCode: created.revisionCode,
            riskLevel: created.riskLevel,
            impactCount: impacts.length,
            synthetic: true,
          },
        },
      });
      await enqueueRevisionNotification(tx, {
        projectId: drawing.projectId,
        revisionId: created.id,
        eventType: "REVISION_CREATED",
        drawingNumber: drawing.number,
        revisionCode: created.revisionCode,
        status: created.status,
        actorName: actor.name,
      });
      return created;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        ok: false,
        message: "That revision code already exists for the selected drawing.",
        errors: { revisionCode: ["Choose the next unused revision code."] },
      };
    }
    throw error;
  }

  await dispatchPendingNotifications(drawing.projectId);
  redirect(`/revisions/${revision.id}`);
}

const transitionSchema = z.object({
  revisionId: z.string().min(1),
  target: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "ISSUED", "CLOSED"]),
  comment: z.string().trim().max(1000).optional(),
});

export async function transitionRevisionAction(
  _state: RevisionActionState,
  formData: FormData,
): Promise<RevisionActionState> {
  const actor = await requireActionUser();
  const parsed = transitionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Invalid workflow request." };

  const revision = await prisma.revision.findUnique({
    where: { id: parsed.data.revisionId },
    select: {
      id: true,
      status: true,
      riskLevel: true,
      summary: true,
      mitigation: true,
      ownerId: true,
      effectiveDate: true,
      createdById: true,
      drawingId: true,
      revisionCode: true,
      drawing: { select: { projectId: true, number: true } },
      _count: { select: { impacts: true, acknowledgements: true } },
      reviews: { where: { decision: "APPROVED" }, select: { id: true } },
    },
  });
  if (!revision) return { ok: false, message: "Revision not found." };

  let projectRole: UserRoleValue;
  try {
    ({ membership: { role: projectRole } } = await requireProjectRole(
      revision.drawing.projectId,
    ));
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Project access denied." };
  }

  const decision = evaluateTransition(
    { id: actor.id, role: projectRole as UserRoleValue },
    {
      status: revision.status,
      riskLevel: revision.riskLevel,
      summary: revision.summary,
      impactCount: revision._count.impacts,
      mitigation: revision.mitigation,
      ownerId: revision.ownerId,
      effectiveDate: revision.effectiveDate,
      createdById: revision.createdById,
      approvalCount: revision.reviews.length,
      acknowledgementCount: revision._count.acknowledgements,
    },
    parsed.data.target as RevisionStatusValue,
  );

  if (!decision.allowed) {
    return { ok: false, message: decision.reasons.join(" ") };
  }

  if (
    ["APPROVED", "DRAFT"].includes(parsed.data.target) &&
    (!parsed.data.comment || parsed.data.comment.length < 5)
  ) {
    return { ok: false, message: "Add a review comment of at least 5 characters." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.revision.update({
      where: { id: revision.id },
      data: {
        status: parsed.data.target,
        ...(parsed.data.target === "ISSUED" ? { issuedAt: new Date() } : {}),
        ...(parsed.data.target === "CLOSED" ? { closedAt: new Date() } : {}),
      },
    });

    if (parsed.data.target === "APPROVED" || parsed.data.target === "DRAFT") {
      await tx.reviewRecord.create({
        data: {
          revisionId: revision.id,
          reviewerId: actor.id,
          decision: parsed.data.target === "APPROVED" ? "APPROVED" : "REJECTED",
          comment: parsed.data.comment ?? "",
        },
      });
    }

    await tx.auditEvent.create({
      data: {
        actorId: actor.id,
        projectId: revision.drawing.projectId,
        drawingId: revision.drawingId,
        revisionId: revision.id,
        action: `STATUS_${parsed.data.target}`,
        entityType: "Revision",
        entityId: revision.id,
        details: {
          from: revision.status,
          to: parsed.data.target,
          comment: parsed.data.comment || null,
        },
      },
    });
    await enqueueRevisionNotification(tx, {
      projectId: revision.drawing.projectId,
      revisionId: revision.id,
      eventType: `STATUS_${parsed.data.target}`,
      drawingNumber: revision.drawing.number,
      revisionCode: revision.revisionCode,
      status: parsed.data.target,
      actorName: actor.name,
    });
  });

  await dispatchPendingNotifications(revision.drawing.projectId);
  revalidatePath(`/revisions/${revision.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/review-queue");
  return { ok: true, message: `Revision moved to ${parsed.data.target}.` };
}

export async function acknowledgeRevisionAction(
  _state: RevisionActionState,
  formData: FormData,
): Promise<RevisionActionState> {
  const actor = await requireActionUser();

  const revisionId = String(formData.get("revisionId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const revision = await prisma.revision.findUnique({
    where: { id: revisionId },
    select: {
      id: true,
      status: true,
      drawingId: true,
      revisionCode: true,
      drawing: { select: { projectId: true, number: true } },
    },
  });
  if (!revision || revision.status !== "ISSUED") {
    return { ok: false, message: "Only an issued revision can be acknowledged." };
  }

  try {
    await requireProjectRole(revision.drawing.projectId, ["PRODUCTION", "ADMIN"]);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Project access denied." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.acknowledgement.upsert({
      where: { revisionId_userId: { revisionId, userId: actor.id } },
      update: { note: note || null },
      create: { revisionId, userId: actor.id, note: note || null },
    });
    await tx.auditEvent.create({
      data: {
        actorId: actor.id,
        projectId: revision.drawing.projectId,
        drawingId: revision.drawingId,
        revisionId,
        action: "FIELD_ACKNOWLEDGED",
        entityType: "Revision",
        entityId: revisionId,
        details: { note: note || null },
      },
    });
    await enqueueRevisionNotification(tx, {
      projectId: revision.drawing.projectId,
      revisionId,
      eventType: "FIELD_ACKNOWLEDGED",
      drawingNumber: revision.drawing.number,
      revisionCode: revision.revisionCode,
      status: revision.status,
      actorName: actor.name,
    });
  });

  await dispatchPendingNotifications(revision.drawing.projectId);
  revalidatePath(`/revisions/${revisionId}`);
  return { ok: true, message: "Field acknowledgement recorded." };
}
