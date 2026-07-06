import { Prisma } from "@prisma/client";

export const PAGE_SIZE = 20;

export type IssuesSearchParams = {
  status?: string;
  priority?: string;
  range?: string;
  page?: string;
};

export type IssuesPageProps = {
  searchParams: Promise<IssuesSearchParams>;
};

export type IssueWithRelations = Prisma.IssueTicketGetPayload<{
  include: {
    property: {
      select: {
        id: true;
        name: true;
      };
    };
    unit: {
      select: {
        id: true;
        houseNo: true;
        property: {
          select: {
            id: true;
            name: true;
          };
        };
        building: {
          select: {
            id: true;
            name: true;
          };
        };
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
    reportedBy: {
      select: {
        id: true;
        fullName: true;
        email: true;
        phone: true;
      };
    };
    resolutionReports: {
      select: {
        id: true;
        status: true;
        workSummary: true;
        materialsUsed: true;
        tenantInstructions: true;
        officeNotes: true;
        submittedAt: true;
      };
    };
  };
}>;

type IssuePagination = {
  totalFiltered: number;
  currentPage: number;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
};

export type IssueDataResult =
  | ({
      ok: true;
      openIssues: number;
      inProgressIssues: number;
      resolvedTodayIssues: number;
      urgentIssues: number;
      issues: IssueWithRelations[];
      errorMessage?: never;
    } & IssuePagination)
  | ({
      ok: false;
      openIssues: number;
      inProgressIssues: number;
      resolvedTodayIssues: number;
      urgentIssues: number;
      issues: IssueWithRelations[];
      errorMessage: string;
    } & IssuePagination);

