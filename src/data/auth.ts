import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
});

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireActionUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Authentication required.");
  return user;
}

export const getProjectMemberships = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return [];

  return prisma.projectMembership.findMany({
    where: { userId: user.id },
    orderBy: { project: { code: "asc" } },
    select: {
      projectId: true,
      role: true,
      project: { select: { id: true, code: true, name: true } },
    },
  });
});

export async function getAccessibleProjectIds() {
  const user = await requireActionUser();
  const memberships = await prisma.projectMembership.findMany({
    where: { userId: user.id },
    select: { projectId: true },
  });
  return memberships.map((membership) => membership.projectId);
}

export async function requireProjectRole(projectId: string, allowedRoles?: UserRole[]) {
  const user = await requireActionUser();
  const membership = await prisma.projectMembership.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
    select: { projectId: true, role: true },
  });

  if (!membership) throw new Error("You do not have access to this project.");
  if (allowedRoles && !allowedRoles.includes(membership.role)) {
    throw new Error("Your project role cannot perform this action.");
  }

  return { user, membership };
}
