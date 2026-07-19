import "server-only";
import { getAccessibleProjectIds } from "@/data/auth";
import { prisma } from "@/lib/prisma";

export async function getDashboardData() {
  const now = new Date();
  const projectIds = await getAccessibleProjectIds();
  const revisionScope = { drawing: { projectId: { in: projectIds } } } as const;
  const [drawings, revisions, reviewQueue, highRisk, overdue, projects, recentEvents] =
    await Promise.all([
      prisma.drawing.count({ where: { status: "ACTIVE", projectId: { in: projectIds } } }),
      prisma.revision.findMany({
        where: revisionScope,
        select: { status: true, riskLevel: true },
      }),
      prisma.revision.findMany({
        where: { ...revisionScope, status: "IN_REVIEW" },
        orderBy: [{ riskLevel: "desc" }, { dueDate: "asc" }],
        take: 6,
        select: {
          id: true,
          revisionCode: true,
          riskLevel: true,
          dueDate: true,
          drawing: {
            select: { number: true, title: true, block: true },
          },
          owner: { select: { name: true } },
        },
      }),
      prisma.revision.findMany({
        where: {
          ...revisionScope,
          riskLevel: { in: ["HIGH", "CRITICAL"] },
          status: { not: "CLOSED" },
        },
        orderBy: [{ riskLevel: "desc" }, { dueDate: "asc" }],
        take: 6,
        select: {
          id: true,
          revisionCode: true,
          status: true,
          riskLevel: true,
          dueDate: true,
          drawing: { select: { number: true, title: true } },
        },
      }),
      prisma.revision.count({
        where: {
          ...revisionScope,
          dueDate: { lt: now },
          status: { notIn: ["CLOSED", "ISSUED"] },
        },
      }),
      prisma.project.findMany({
        where: { id: { in: projectIds } },
        orderBy: { code: "asc" },
        select: {
          id: true,
          code: true,
          name: true,
          vesselType: true,
          drawings: {
            select: {
              revisions: { select: { status: true } },
            },
          },
        },
      }),
      prisma.auditEvent.findMany({
        where: { projectId: { in: projectIds } },
        orderBy: { createdAt: "desc" },
        take: 7,
        select: {
          id: true,
          action: true,
          entityType: true,
          createdAt: true,
          actor: { select: { name: true } },
          drawing: { select: { number: true } },
        },
      }),
    ]);

  const statusCounts = revisions.reduce<Record<string, number>>((counts, revision) => {
    counts[revision.status] = (counts[revision.status] ?? 0) + 1;
    return counts;
  }, {});
  const openHighRisk = revisions.filter(
    (revision) =>
      ["HIGH", "CRITICAL"].includes(revision.riskLevel) && revision.status !== "CLOSED",
  ).length;

  return {
    metrics: {
      drawings,
      openRevisions: revisions.filter((revision) => revision.status !== "CLOSED").length,
      reviewQueue: statusCounts.IN_REVIEW ?? 0,
      openHighRisk,
      overdue,
    },
    statusCounts,
    reviewQueue,
    highRisk,
    recentEvents,
    projects: projects.map((project) => {
      const projectRevisions = project.drawings.flatMap((drawing) => drawing.revisions);
      const closed = projectRevisions.filter((revision) => revision.status === "CLOSED").length;
      return {
        id: project.id,
        code: project.code,
        name: project.name,
        vesselType: project.vesselType,
        drawingCount: project.drawings.length,
        revisionCount: projectRevisions.length,
        completion: projectRevisions.length
          ? Math.round((closed / projectRevisions.length) * 100)
          : 0,
      };
    }),
  };
}
