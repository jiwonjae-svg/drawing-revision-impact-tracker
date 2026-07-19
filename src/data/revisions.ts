import "server-only";
import { getAccessibleProjectIds } from "@/data/auth";
import { prisma } from "@/lib/prisma";

export async function getRevision(id: string) {
  const projectIds = await getAccessibleProjectIds();
  return prisma.revision.findFirst({
    where: { id, drawing: { projectId: { in: projectIds } } },
    select: {
      id: true,
      revisionCode: true,
      status: true,
      riskLevel: true,
      summary: true,
      reason: true,
      mitigation: true,
      effectiveDate: true,
      dueDate: true,
      issuedAt: true,
      closedAt: true,
      createdAt: true,
      updatedAt: true,
      createdById: true,
      drawing: {
        select: {
          id: true,
          number: true,
          title: true,
          block: true,
          zone: true,
          discipline: true,
          project: { select: { id: true, code: true, name: true } },
        },
      },
      owner: { select: { id: true, name: true, role: true } },
      createdBy: { select: { id: true, name: true } },
      impacts: { orderBy: [{ severity: "desc" }, { type: "asc" }] },
      reviews: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          decision: true,
          comment: true,
          createdAt: true,
          reviewer: { select: { name: true, role: true } },
        },
      },
      acknowledgements: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          note: true,
          createdAt: true,
          user: { select: { name: true, role: true } },
        },
      },
      auditEvents: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          action: true,
          details: true,
          createdAt: true,
          actor: { select: { name: true } },
        },
      },
    },
  });
}

export async function getReviewQueue() {
  const projectIds = await getAccessibleProjectIds();
  return prisma.revision.findMany({
    where: { status: "IN_REVIEW", drawing: { projectId: { in: projectIds } } },
    orderBy: [{ riskLevel: "desc" }, { dueDate: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      revisionCode: true,
      riskLevel: true,
      summary: true,
      dueDate: true,
      createdAt: true,
      createdById: true,
      drawing: {
        select: {
          number: true,
          title: true,
          block: true,
          discipline: true,
          project: { select: { code: true } },
        },
      },
      owner: { select: { name: true } },
      _count: { select: { impacts: true, reviews: true } },
    },
  });
}

export async function getRevisionFormOptions() {
  const projectIds = await getAccessibleProjectIds();
  const [drawings, owners] = await Promise.all([
    prisma.drawing.findMany({
      where: { status: "ACTIVE", projectId: { in: projectIds } },
      orderBy: { number: "asc" },
      select: { id: true, number: true, title: true, project: { select: { code: true } } },
    }),
    prisma.user.findMany({
      where: {
        projectMemberships: {
          some: { projectId: { in: projectIds }, role: { in: ["DESIGNER", "ADMIN"] } },
        },
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true },
    }),
  ]);
  return { drawings, owners };
}
