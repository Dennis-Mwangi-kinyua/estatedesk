import { Prisma, TicketPriority, TicketStatus } from "@prisma/client";
import { getCaretakerAllowedUnitIds } from "@/lib/caretaker/access";
import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { IssuesWorkspace } from "@/app/(app)/dashboard/caretaker/issues/_components/issues-workspace";
import {
  getIssueBoardDescription,
  getIssueBoardTitle,
  parsePriority,
  parseStatus,
  startOfToday,
} from "@/app/(app)/dashboard/caretaker/issues/_lib/helpers";
import { getIssueData } from "@/app/(app)/dashboard/caretaker/issues/_lib/queries";
import type { IssuesPageProps } from "@/app/(app)/dashboard/caretaker/issues/_lib/types";

export const dynamic = "force-dynamic";

export default async function IssuesPage({ searchParams }: IssuesPageProps) {
  const session = await requireCaretakerAccess();
  const orgId = session.activeOrgId!;
  const allowedUnitIds = await getCaretakerAllowedUnitIds({
    orgId,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
  });
  const resolvedSearchParams = await searchParams;

  const status = parseStatus(resolvedSearchParams.status);
  const priority = parsePriority(resolvedSearchParams.priority);
  const range = resolvedSearchParams.range ?? "";

  const today = startOfToday();

  const issueWhere: Prisma.IssueTicketWhereInput = {
    orgId,
    OR: [
      { assignedToUserId: session.userId },
      ...(allowedUnitIds.length > 0
        ? [{ unitId: { in: allowedUnitIds } }]
        : []),
    ],
  };

  if (priority) {
    issueWhere.priority = priority;
  }

  if (status === TicketStatus.RESOLVED && range === "today") {
    issueWhere.status = {
      in: [TicketStatus.RESOLVED, TicketStatus.CLOSED],
    };
    issueWhere.resolvedAt = {
      gte: today,
    };
  } else if (status) {
    issueWhere.status = status;
  }

  const issueData = await getIssueData({
    orgId,
    issueWhere,
    today,
    page: Number(resolvedSearchParams.page ?? "1"),
  });

  return (
    <IssuesWorkspace
      issueData={issueData}
      currentUserId={session.userId}
      boardTitle={getIssueBoardTitle({ status, priority, range })}
      boardDescription={getIssueBoardDescription({ status, priority, range })}
      status={status}
      priority={priority}
      range={range}
    />
  );
}