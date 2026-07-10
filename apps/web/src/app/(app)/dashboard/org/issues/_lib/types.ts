import { Prisma } from "@prisma/client";

export const ISSUE_PAGE_PATH = "/dashboard/org/issues";
export const RESOLUTION_REPORTS_QUEUE_PATH =
  "/dashboard/org/issues/resolution-reports";
export const HISTORY_PAGE_SIZE = 12;
export const STAGE_BOARD_COLUMN_LIMIT = 12;

export const ORG_ISSUE_ROLES = [
  "ADMIN",
  "MANAGER",
  "OFFICE",
  "CARETAKER",
] as const;

export const ORG_ASSIGNMENT_ROLES = ["ADMIN", "MANAGER", "OFFICE"] as const;

export type IssuesSearchParams = {
  page?: string;
  issueId?: string;
  status?: string;
  shared?: string;
  title?: string;
  description?: string;
};

export type IssuesPageProps = {
  searchParams?: Promise<IssuesSearchParams>;
};

export const orgMembershipArgs =
  Prisma.validator<Prisma.MembershipDefaultArgs>()({
    select: {
      orgId: true,
      role: true,
      org: {
        select: {
          id: true,
          name: true,
          slug: true,
          currencyCode: true,
          timezone: true,
        },
      },
    },
  });

export type OrgMembershipContext = Prisma.MembershipGetPayload<
  typeof orgMembershipArgs
>;

export const orgIssueArgs =
  Prisma.validator<Prisma.IssueTicketDefaultArgs>()({
    include: {
      property: true,
      unit: {
        include: {
          property: true,
          building: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
      reportedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
      resolutionReports: {
        orderBy: {
          submittedAt: "desc",
        },
        take: 3,
        include: {
          caretaker: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          officeReviewedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          tenantConfirmedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      },
      photoAsset: true,
    },
  });

export type OrgIssue = Prisma.IssueTicketGetPayload<typeof orgIssueArgs>;

export type CaretakerOption = {
  id: string;
  fullName: string | null;
  email: string | null;
};

export type IssuesStats = {
  totalIssues: number;
  newIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  cancelledIssues: number;
};

export type IssueStatusFilter = "all" | "new" | "progress" | "resolved" | "cancelled";

export type OrgIssuesPageData = {
  membership: OrgMembershipContext;
  issues: OrgIssue[];
  totalFiltered: number;
  caretakers: CaretakerOption[];
  canAssignCaretaker: boolean;
  selectedIssue: OrgIssue | null;
  paginatedIssues: OrgIssue[];
  currentPage: number;
  totalPages: number;
  historyStart: number;
  historyEnd: number;
  stats: IssuesStats;
  activeFilter: IssueStatusFilter;
};

export type IssueDetailPageData = {
  membership: OrgMembershipContext;
  issue: OrgIssue;
  caretakers: CaretakerOption[];
  canAssignCaretaker: boolean;
};
