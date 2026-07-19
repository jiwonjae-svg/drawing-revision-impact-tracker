import "server-only";
import { getAccessibleProjectIds } from "@/data/auth";
import { prisma } from "@/lib/prisma";

export async function getAuditEvents() {
  const projectIds = await getAccessibleProjectIds();
  return prisma.auditEvent.findMany({
    where: { projectId: { in: projectIds } },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      details: true,
      createdAt: true,
      actor: { select: { name: true, role: true } },
      project: { select: { code: true } },
      drawing: { select: { number: true } },
      revision: { select: { revisionCode: true } },
    },
  });
}

export async function getDemoUsers() {
  const projectIds = await getAccessibleProjectIds();
  return prisma.user.findMany({
    where: { projectMemberships: { some: { projectId: { in: projectIds } } } },
    orderBy: { role: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      projectMemberships: {
        where: { projectId: { in: projectIds } },
        orderBy: { project: { code: "asc" } },
        select: { role: true, project: { select: { code: true } } },
      },
    },
  });
}
