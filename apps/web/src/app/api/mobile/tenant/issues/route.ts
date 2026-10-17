import { prisma } from "@/lib/prisma";
import { mobileIssueInputSchema, type MobileIssues } from "@estatedesk/contracts/mobile";
import { mobileJson } from "@/lib/mobile/api";
import { nativeRoute, nativeBody, actionResult } from "@/lib/mobile/route";
import { reportIssueAction } from "@/app/(app)/dashboard/tenant/issues/report/_lib/actions";

export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    const leases = await prisma.lease.findMany({
      where: { orgId: session.activeOrgId!, status: "ACTIVE", deletedAt: null, tenant: { userId: session.userId, deletedAt: null } },
      select: { unit: { select: { id: true, houseNo: true, property: { select: { name: true } } } } },
    });
    const issues = await prisma.issueTicket.findMany({
      where: { orgId: session.activeOrgId!, reportedByUserId: session.userId },
      select: { id: true, title: true, description: true, status: true, priority: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 100,
    });
    const result: MobileIssues = { units: leases.map(({ unit }) => ({ id: unit.id, label: `${unit.property.name} / ${unit.houseNo}` })), issues: issues.map(issue => ({ ...issue, createdAt: issue.createdAt.toISOString() })) };
    return mobileJson(result);
  }, { role: "TENANT" });
}

export async function POST(request: Request) {
  return nativeRoute(request, async session => {
    const input = await nativeBody(request, mobileIssueInputSchema);
    const lease = await prisma.lease.findFirst({ where: { unitId: input.unitId, orgId: session.activeOrgId!, status: "ACTIVE", deletedAt: null, tenant: { userId: session.userId, deletedAt: null } }, select: { id: true } });
    if (!lease) return mobileJson({ error: "Choose a unit on your active lease." }, 403);
    const form = new FormData();
    for (const [key, value] of Object.entries(input)) form.set(key, value);
    return actionResult(() => reportIssueAction(form), "/dashboard/tenant/issues");
  }, { role: "TENANT" });
}
