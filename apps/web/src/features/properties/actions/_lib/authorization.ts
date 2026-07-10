import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function getAuthorizedOrgId(
  userId: string,
  activeOrgId?: string | null,
) {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      orgId: activeOrgId ?? undefined,
      role: {
        in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
      },
      org: {
        deletedAt: null,
        status: "ACTIVE",
      },
      user: {
        deletedAt: null,
      },
    },
    select: {
      orgId: true,
    },
  });

  if (membership) return membership.orgId;

  const fallbackMembership = await prisma.membership.findFirst({
    where: {
      userId,
      role: {
        in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
      },
      org: {
        deletedAt: null,
        status: "ACTIVE",
      },
      user: {
        deletedAt: null,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      orgId: true,
    },
  });

  if (!fallbackMembership) {
    redirect("/dashboard");
  }

  return fallbackMembership.orgId;
}