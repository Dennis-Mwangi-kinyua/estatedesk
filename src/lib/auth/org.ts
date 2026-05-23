import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";

export async function requireCurrentOrgId() {
  const session = await requireUserSession();

  if (session.activeOrgId) {
    return session.activeOrgId;
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.userId,
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
  const session = await requireUserSession();

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.userId,
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