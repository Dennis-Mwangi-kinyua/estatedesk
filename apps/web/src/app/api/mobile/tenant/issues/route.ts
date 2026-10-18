import { nativeForm } from "@/lib/mobile/form";
import { prisma } from "@/lib/prisma";
import { mobileIssueInputSchema, type MobileIssues } from "@estatedesk/contracts/mobile";
import { mobileJson } from "@/lib/mobile/api";
import { nativeRoute, actionResult } from "@/lib/mobile/route";
import { reportIssueAction } from "@/app/(app)/dashboard/tenant/issues/report/_lib/actions";
import { nativeTenantSection } from "@/lib/mobile/tenant-section";

export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    if (!await nativeTenantSection(session, "/dashboard/tenant/issues")) return mobileJson({ error: "Maintenance access is unavailable." }, 403);
    const leases = await prisma.lease.findMany({
      where: { orgId: session.activeOrgId!, status: "ACTIVE", deletedAt: null, tenant: { userId: session.userId, deletedAt: null } },
      select: { unit: { select: { id: true, houseNo: true, property: { select: { name: true } } } } },
    });
    const issues = await prisma.issueTicket.findMany({
      where: { orgId: session.activeOrgId!, reportedByUserId: session.userId },
      select: { id: true, title: true, description: true, status: true, priority: true, createdAt: true, resolutionReports: { where: { status: "OFFICE_APPROVED" }, orderBy: { createdAt: "desc" }, take: 1, select: { id: true, workSummary: true, materialsUsed: true, tenantInstructions: true } } }, orderBy: { createdAt: "desc" }, take: 100,
    });
    const result: MobileIssues = { units: leases.map(({ unit }) => ({ id: unit.id, label: `${unit.property.name} / ${unit.houseNo}` })), issues: issues.map(({ resolutionReports, ...issue }) => ({ ...issue, createdAt: issue.createdAt.toISOString(), resolution: resolutionReports[0] ?? null })) };
    return mobileJson(result);
  }, { role: "TENANT" });
}

export async function POST(request: Request) {
  return nativeRoute(request, async session => {
    if (!await nativeTenantSection(session, "/dashboard/tenant/issues")) return mobileJson({ error: "Maintenance access is unavailable." }, 403);
    const { input, form } = await nativeForm(request, mobileIssueInputSchema);
    const lease = await prisma.lease.findFirst({ where: { unitId: input.unitId, orgId: session.activeOrgId!, status: "ACTIVE", deletedAt: null, tenant: { userId: session.userId, deletedAt: null } }, select: { id: true } });
    if (!lease) return mobileJson({ error: "Choose a unit on your active lease." }, 403);
    for (const [key, value] of Object.entries(input)) form.set(key, value);
    return actionResult(() => reportIssueAction(form), "/dashboard/tenant/issues");
  }, { role: "TENANT" });
}
