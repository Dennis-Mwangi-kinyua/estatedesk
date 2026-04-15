import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";

export async function getCurrentTenantShell() {
  const session = await requireUserSession();

  return prisma.tenant.findFirst({
    where: {
      userId: session.userId,
      deletedAt: null,
    },
    select: {
      id: true,
      fullName: true,
      org: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function getCurrentTenantWithActiveLease() {
  const session = await requireUserSession();

  return prisma.tenant.findFirst({
    where: {
      userId: session.userId,
      deletedAt: null,
    },
    include: {
      leases: {
        where: {
          deletedAt: null,
          status: "ACTIVE",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        include: {
          unit: {
            include: {
              building: true,
              property: true,
            },
          },
        },
      },
    },
  });
}