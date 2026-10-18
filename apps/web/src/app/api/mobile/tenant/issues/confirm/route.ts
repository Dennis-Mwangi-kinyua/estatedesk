import { prisma } from "@/lib/prisma";
import { nativeRoute, nativeBody, actionResult } from "@/lib/mobile/route";
import { mobileJson } from "@/lib/mobile/api";
import { nativeTenantSection } from "@/lib/mobile/tenant-section";
import { mobileIssueConfirmationSchema } from "@estatedesk/contracts/mobile";
import { confirmIssueResolutionAction } from "@/app/(app)/dashboard/tenant/issues/actions";

export async function POST(request: Request) {
  return nativeRoute(request, async session => {
    if (!await nativeTenantSection(session, "/dashboard/tenant/issues")) return mobileJson({ error: "Maintenance access is unavailable." }, 403);
    const input = await nativeBody(request, mobileIssueConfirmationSchema);
    const report = await prisma.issueResolutionReport.findFirst({ where: { id: input.reportId, issueId: input.issueId, orgId: session.activeOrgId!, status: "OFFICE_APPROVED", issue: { reportedByUserId: session.userId } }, select: { id: true } });
    if (!report) return mobileJson({ error: "This completion report is unavailable or has already been confirmed. Refresh your requests." }, 409);
    const form = new FormData(); for (const [key, value] of Object.entries(input)) form.set(key, value);
    return actionResult(() => confirmIssueResolutionAction(form), "/dashboard/tenant/issues");
  }, { role: "TENANT" });
}
