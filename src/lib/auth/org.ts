import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";

export async function requireCurrentOrgId() {
  const user = await requireUser();

  if (user.orgId) return user.orgId;

  const membership = await prisma.membership.findFirst({
    where: {
      userId: user.id,
      org: {
        deletedAt: null,
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

  if (!membership?.orgId) {
    throw new Error("No active organization found");
  }

  return membership.orgId;
}

export async function requireOrgAccess(orgId: string) {
  const user = await requireUser();

  const membership = await prisma.membership.findFirst({
    where: {
      userId: user.id,
      orgId,
      org: {
        deletedAt: null,
      },
      user: {
        deletedAt: null,
      },
    },
    select: {
      id: true,
      role: true,
      scopeType: true,
    },
  });

  if (!membership) {
    throw new Error("Forbidden");
  }

  return membership;
}