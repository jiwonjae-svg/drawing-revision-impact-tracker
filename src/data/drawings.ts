import "server-only";
import type { Prisma } from "@prisma/client";
import { getAccessibleProjectIds } from "@/data/auth";
import { prisma } from "@/lib/prisma";

export type DrawingFilters = {
  q?: string;
  project?: string;
  discipline?: string;
  status?: string;
  sort?: string;
};

export async function getDrawings(filters: DrawingFilters = {}) {
  const projectIds = await getAccessibleProjectIds();
  const where: Prisma.DrawingWhereInput = {
    projectId: filters.project && projectIds.includes(filters.project)
      ? filters.project
      : { in: filters.project ? [] : projectIds },
    ...(filters.q
      ? {
          OR: [
            { number: { contains: filters.q, mode: "insensitive" } },
            { title: { contains: filters.q, mode: "insensitive" } },
            { block: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.discipline
      ? { discipline: filters.discipline as Prisma.EnumDisciplineFilter["equals"] }
      : {}),
    ...(filters.status
      ? { status: filters.status as Prisma.EnumDrawingStatusFilter["equals"] }
      : {}),
  };

  const orderBy: Prisma.DrawingOrderByWithRelationInput =
    filters.sort === "updated"
      ? { updatedAt: "desc" }
      : filters.sort === "block"
        ? { block: "asc" }
        : { number: "asc" };

  return prisma.drawing.findMany({
    where,
    orderBy,
    take: 200,
    select: {
      id: true,
      number: true,
      title: true,
      block: true,
      zone: true,
      discipline: true,
      status: true,
      updatedAt: true,
      project: { select: { id: true, code: true, name: true } },
      revisions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          revisionCode: true,
          status: true,
          riskLevel: true,
          dueDate: true,
        },
      },
      _count: { select: { revisions: true } },
    },
  });
}

export async function getDrawing(id: string) {
  const projectIds = await getAccessibleProjectIds();
  return prisma.drawing.findFirst({
    where: { id, projectId: { in: projectIds } },
    select: {
      id: true,
      number: true,
      title: true,
      block: true,
      zone: true,
      discipline: true,
      status: true,
      updatedAt: true,
      project: { select: { id: true, code: true, name: true, vesselType: true } },
      revisions: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          revisionCode: true,
          status: true,
          riskLevel: true,
          summary: true,
          effectiveDate: true,
          dueDate: true,
          createdAt: true,
          owner: { select: { name: true } },
          _count: { select: { impacts: true, reviews: true, acknowledgements: true } },
        },
      },
    },
  });
}

export async function getDrawingFilterOptions() {
  const projectIds = await getAccessibleProjectIds();
  const [projects, disciplines] = await Promise.all([
    prisma.project.findMany({
      where: { id: { in: projectIds } },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.drawing.findMany({
      where: { projectId: { in: projectIds } },
      distinct: ["discipline"],
      orderBy: { discipline: "asc" },
      select: { discipline: true },
    }),
  ]);
  return { projects, disciplines: disciplines.map((item) => item.discipline) };
}
