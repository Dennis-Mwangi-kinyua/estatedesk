import {
  getCaretakerAllowedUnitIds,
  type MembershipScope,
} from "@/lib/caretaker/access";
import { prisma } from "@/lib/prisma";

export async function getCaretakerManageableIssue({
  orgId,
  caretakerUserId,
  membershipScope,
  issueId,
}: {
  orgId: string;
  caretakerUserId: string;
  membershipScope: MembershipScope;
  issueId: string;
}) {
  const [issue, allowedUnitIds] = await Promise.all([
    prisma.issueTicket.findFirst({
      where: {
        id: issueId,
        orgId,
      },
      select: {
        id: true,
        title: true,
        status: true,
        assignedToUserId: true,
        unitId: true,
        reportedByUserId: true,
        resolutionNotes: true,
        orgId: true,
      },
    }),
    getCaretakerAllowedUnitIds({
      orgId,
      caretakerUserId,
      membershipScope,
    }),
  ]);

  if (!issue) {
    return null;
  }

  const inScope =
    issue.assignedToUserId === caretakerUserId ||
    (issue.unitId ? allowedUnitIds.includes(issue.unitId) : false);

  if (!inScope) {
    return null;
  }

  return issue;
}