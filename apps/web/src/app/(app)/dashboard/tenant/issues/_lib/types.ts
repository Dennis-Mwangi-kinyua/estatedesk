import { Prisma } from "@prisma/client";

export type TenantIssuesPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

export const tenantIssuesArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    leases: {
      where: {
        deletedAt: null,
      },
      select: {
        unitId: true,
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

export type TenantIssuesResult = Prisma.TenantGetPayload<typeof tenantIssuesArgs>;

export type TenantIssue = Prisma.IssueTicketGetPayload<{
  include: {
    property: true;
    unit: {
      include: {
        property: true;
      };
    };
    assignedTo: {
      select: {
        id: true;
        fullName: true;
        email: true;
        phone: true;
      };
    };
    resolutionReports: {
      orderBy: {
        submittedAt: "desc";
      };
      take: 1;
      select: {
        id: true;
        status: true;
        workSummary: true;
        materialsUsed: true;
        tenantInstructions: true;
        officeNotes: true;
        submittedAt: true;
        officeReviewedAt: true;
      };
    };
    photoAsset: true;
  };
}>;

export type TenantIssuesPageData = {
  issues: TenantIssue[];
  primaryUnit: TenantIssuesResult["leases"][number]["unit"] | undefined;
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  latestIssue: TenantIssue | null;
  totalPages: number;
};

export const HISTORY_PAGE_SIZE = 10;