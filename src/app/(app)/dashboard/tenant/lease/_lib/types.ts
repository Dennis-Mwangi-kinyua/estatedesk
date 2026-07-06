import { Prisma } from "@prisma/client";

export const tenantLeaseArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    leases: {
      where: {
        deletedAt: null,
      },
      orderBy: {
        startDate: "desc",
      },
      include: {
        unit: {
          include: {
            building: true,
            property: true,
          },
        },
        contractDocument: true,
        rentCharges: {
          orderBy: {
            dueDate: "desc",
          },
          take: 6,
        },
      },
    },
  },
});

export type TenantLeaseResult = Prisma.TenantGetPayload<typeof tenantLeaseArgs>;

export type TenantLeasePageData = {
  tenant: TenantLeaseResult | null;
  activeLeases: TenantLeaseResult["leases"];
  historicalLeases: TenantLeaseResult["leases"];
  latestLease: TenantLeaseResult["leases"][number] | null;
};