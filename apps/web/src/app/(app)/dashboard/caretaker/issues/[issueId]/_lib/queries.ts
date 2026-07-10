import { Prisma } from "@prisma/client";
import { getCaretakerManageableIssue } from "@/app/(app)/dashboard/caretaker/issues/_lib/access";
import type { MembershipScope } from "@/lib/caretaker/access";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { prisma } from "@/lib/prisma";
import {
  decodePublicId,
  encodePublicId,
  isEncodedPublicId,
} from "@/lib/public-id";
import { ISSUE_DETAIL_LOAD_ERROR_MESSAGE } from "./helpers";

const issueDetailInclude = {
  property: {
    select: {
      id: true,
      name: true,
    },
  },
  unit: {
    select: {
      id: true,
      houseNo: true,
      property: {
        select: {
          id: true,
          name: true,
        },
      },
      building: {
        select: {
          id: true,
          name: true,
        },
      },
      leases: {
        where: {
          deletedAt: null,
          status: "ACTIVE",
        },
        take: 1,
        select: {
          tenant: {
            select: {
              id: true,
              slug: true,
              fullName: true,
              phone: true,
              email: true,
            },
          },
        },
      },
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
  photoAsset: {
    select: {
      id: true,
      fileName: true,
      key: true,
      mimeType: true,
    },
  },
  resolutionReports: {
    orderBy: {
      submittedAt: "desc" as const,
    },
    select: {
      id: true,
      status: true,
      workSummary: true,
      materialsUsed: true,
      tenantInstructions: true,
      officeNotes: true,
      submittedAt: true,
    },
  },
} as const satisfies Prisma.IssueTicketInclude;

export type CaretakerIssueDetail = Prisma.IssueTicketGetPayload<{
  include: typeof issueDetailInclude;
}>;

export async function getCaretakerIssueDetail({
  orgId,
  caretakerUserId,
  membershipScope,
  publicIssueId,
}: {
  orgId: string;
  caretakerUserId: string;
  membershipScope: MembershipScope;
  publicIssueId: string;
}) {
  const issueId = decodePublicId(publicIssueId, "issue");

  try {
    const manageableIssue = await getCaretakerManageableIssue({
      orgId,
      caretakerUserId,
      membershipScope,
      issueId,
    });

    if (!manageableIssue) {
      return {
        ok: false as const,
        notFound: true,
        errorMessage: "This issue could not be found.",
        redirectTo: null,
      };
    }

    const issue = await retryTransientDatabaseOperation(
      () =>
        prisma.issueTicket.findFirst({
          where: {
            id: issueId,
            orgId,
          },
          include: issueDetailInclude,
        }),
      { label: "caretaker issue detail load" },
    );

    if (!issue) {
      return {
        ok: false as const,
        notFound: true,
        errorMessage: "This issue could not be found.",
        redirectTo: null,
      };
    }

    const redirectTo = !isEncodedPublicId(publicIssueId)
      ? `/dashboard/caretaker/issues/${encodePublicId(issue.id, "issue")}`
      : null;

    return {
      ok: true as const,
      issue,
      redirectTo,
    };
  } catch {
    return {
      ok: false as const,
      notFound: false,
      errorMessage: ISSUE_DETAIL_LOAD_ERROR_MESSAGE,
      redirectTo: null,
    };
  }
}