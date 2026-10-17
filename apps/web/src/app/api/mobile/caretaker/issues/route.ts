import { prisma } from "@/lib/prisma";
import { mobileWorkOrderInputSchema } from "@estatedesk/contracts/mobile";
import { mobileJson } from "@/lib/mobile/api";
import { nativeRoute, nativeBody, actionResult } from "@/lib/mobile/route";
import { getCaretakerAllowedUnitIds } from "@/lib/caretaker/access";
import { caretakerCanStartIssue, caretakerCanUpdateIssue } from "@/lib/caretaker/issue-actions";
import { getCaretakerManageableIssue } from "@/app/(app)/dashboard/caretaker/issues/_lib/access";
import { getCaretakerIssueHref } from "@/app/(app)/dashboard/caretaker/_lib/paths";
import { startCaretakerIssueAction, addCaretakerIssueProgressNoteAction, submitIssueResolutionReportAction } from "@/app/(app)/dashboard/caretaker/issues/actions";

export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    const allowedUnitIds = await getCaretakerAllowedUnitIds({ orgId: session.activeOrgId!, caretakerUserId: session.userId, membershipScope: session.membershipScope });
    const issues = await prisma.issueTicket.findMany({
      where: { orgId: session.activeOrgId!, OR: [{ assignedToUserId: session.userId }, { unitId: { in: allowedUnitIds } }] },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 100,
      select: { id: true, title: true, description: true, status: true, priority: true, createdAt: true, assignedToUserId: true, resolutionNotes: true,
        property: { select: { name: true } }, unit: { select: { houseNo: true, property: { select: { name: true } } } },
        resolutionReports: { orderBy: { submittedAt: "desc" }, take: 1, select: { status: true } },
        _count: { select: { resolutionReports: { where: { status: { in: ["SUBMITTED", "OFFICE_APPROVED"] } } } } } },
    });
    return mobileJson(issues.map(issue => ({
      id: issue.id, title: issue.title, description: issue.description, status: issue.status, priority: issue.priority,
      createdAt: issue.createdAt.toISOString(), progressNotes: issue.resolutionNotes,
      propertyName: issue.unit?.property.name ?? issue.property?.name ?? null, unitLabel: issue.unit?.houseNo ?? null,
      canStart: caretakerCanStartIssue(issue, session.userId), canUpdate: caretakerCanUpdateIssue(issue, session.userId),
      pendingReport: issue._count.resolutionReports > 0, reportStatus: issue.resolutionReports[0]?.status ?? null,
    })));
  }, { role: "CARETAKER" });
}

export async function POST(request: Request) {
  return nativeRoute(request, async session => {
    const input = await nativeBody(request, mobileWorkOrderInputSchema);
    const issue = await getCaretakerManageableIssue({ orgId: session.activeOrgId!, caretakerUserId: session.userId, membershipScope: session.membershipScope, issueId: input.issueId });
    if (!issue) return mobileJson({ error: "Work order not found in your assigned area." }, 404);
    if (input.action === "start" ? !caretakerCanStartIssue(issue, session.userId) : !caretakerCanUpdateIssue(issue, session.userId)) {
      return mobileJson({ error: "This work order changed or is assigned to another caretaker. Refresh the list." }, 409);
    }
    if (input.action === "complete") {
      const pending = await prisma.issueResolutionReport.count({ where: { issueId: issue.id, orgId: session.activeOrgId!, status: { in: ["SUBMITTED", "OFFICE_APPROVED"] } } });
      if (pending) return mobileJson({ error: "A completion report is already awaiting review." }, 409);
    }
    const form = new FormData();
    for (const [key, value] of Object.entries(input)) if (key !== "action") form.set(key, value);
    const action = input.action === "start" ? startCaretakerIssueAction : input.action === "note" ? addCaretakerIssueProgressNoteAction : submitIssueResolutionReportAction;
    return actionResult(() => action(form), getCaretakerIssueHref(issue.id));
  }, { role: "CARETAKER" });
}
