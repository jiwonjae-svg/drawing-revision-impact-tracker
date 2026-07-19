import "server-only";
import { getAccessibleProjectIds } from "@/data/auth";
import { prisma } from "@/lib/prisma";

export async function getIntegrationOverview() {
  const projectIds = await getAccessibleProjectIds();
  const [projects, sources, notificationCounts] = await Promise.all([
    prisma.project.findMany({
      where: { id: { in: projectIds } },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.integrationSource.findMany({
      where: { projectId: { in: projectIds } },
      orderBy: [{ project: { code: "asc" } }, { type: "asc" }],
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        lastSyncAt: true,
        project: { select: { id: true, code: true } },
        batches: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            fileName: true,
            status: true,
            rowCount: true,
            errorCount: true,
            summary: true,
            createdAt: true,
            importedBy: { select: { name: true } },
          },
        },
      },
    }),
    prisma.notificationOutbox.groupBy({
      by: ["status"],
      where: { projectId: { in: projectIds } },
      _count: { _all: true },
    }),
  ]);

  return {
    projects,
    sources,
    notificationCounts: Object.fromEntries(
      notificationCounts.map((item) => [item.status, item._count._all]),
    ) as Record<string, number>,
    webhookConfigured: Boolean(process.env.NOTIFICATION_WEBHOOK_URL),
  };
}
