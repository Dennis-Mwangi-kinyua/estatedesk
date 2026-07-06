import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type TenantNoticesResult = Prisma.TenantGetPayload<typeof tenantNoticesArgs>;

export const tenantNoticesArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    leases: {
      where: {
        deletedAt: null,
        status: "ACTIVE",
      },
      orderBy: {
        startDate: "desc",
      },
      take: 1,
      include: {
        unit: {
          include: {
            property: true,
            building: true,
          },
        },
      },
    },
    notifications: {
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    },
    moveOutNotices: {
      orderBy: {
        createdAt: "desc",
      },
      include: {
        lease: {
          include: {
            unit: {
              include: {
                property: true,
                building: true,
              },
            },
          },
        },
        inspection: true,
      },
      take: 50,
    },
  },
});

export async function getTenantNoticesData(userId: string, orgId: string) {
  return prisma.tenant.findFirst({
    where: {
      userId,
      orgId,
      deletedAt: null,
    },
    ...tenantNoticesArgs,
  });
}