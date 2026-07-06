import { Prisma } from "@prisma/client";

export type TenantMaintenancePageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

export const HISTORY_PAGE_SIZE = 10;

export const tenantMaintenanceArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    leases: {
      where: {
        status: "ACTIVE",
        deletedAt: null,
      },
      take: 1,
      orderBy: {
        startDate: "desc",
      },
      include: {
        unit: {
          include: {
            property: true,
            building: true,
          },
        },
      },
    },
  },
});

export type TenantMaintenanceResult =
  Prisma.TenantGetPayload<typeof tenantMaintenanceArgs>;

export type MaintenanceIssue = Prisma.IssueTicketGetPayload<{
  include: {
    assignedTo: {
      select: {
        id: true;
        fullName: true;
      };
    };
    property: true;
    photoAsset: true;
  };
}>;

export type TenantMaintenancePageData = {
  activeUnit: NonNullable<TenantMaintenanceResult["leases"][number]["unit"]> | null;
  issues: MaintenanceIssue[];
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  latestIssue: MaintenanceIssue | null;
  totalPages: number;
};