import { Prisma } from "@prisma/client";

export type ReportIssuePageProps = {
  searchParams?: Promise<{
    error?: string;
    title?: string;
    description?: string;
  }>;
};

export const tenantIssueReportArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    leases: {
      where: {
        deletedAt: null,
        status: "ACTIVE",
      },
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

export type TenantIssueReportResult = Prisma.TenantGetPayload<
  typeof tenantIssueReportArgs
>;

export type ReportIssuePageData = {
  leaseUnits: TenantIssueReportResult["leases"][number]["unit"][];
  errorMessage: string | null;
  sharedTitle: string;
  sharedDescription: string;
};