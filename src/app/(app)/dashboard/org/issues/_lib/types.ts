import { Prisma } from "@prisma/client";

export const ISSUE_PAGE_PATH = "/dashboard/org/issues";
export const HISTORY_PAGE_SIZE = 12;

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

export type OrgIssuesPageData = {
  membership: OrgMembershipContext;
  issues: OrgIssue[];
  caretakers: CaretakerOption[];
  canAssignCaretaker: boolean;
  selectedIssue: OrgIssue | null;
  paginatedIssues: OrgIssue[];
  currentPage: number;
  totalPages: number;
  historyStart: number;
  historyEnd: number;
  stats: IssuesStats;
};