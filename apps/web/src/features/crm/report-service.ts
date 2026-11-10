import "server-only";
import type { Prisma } from "@prisma/client";
import type { AppSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { tenantCrmWhere } from "./policy";
import { scopedUnitWhere } from "@/lib/permissions/record-scope";
import { canAccessWorkspacePath } from "@/lib/permissions/workspace-access";
export async function loadCrmReport(session: AppSession, platform: boolean, rawDays?: string) {
  if (platform ? !["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.platformRole) : !canAccessWorkspacePath(session, "/dashboard/org/crm")) throw new Error("CRM access required.");
  const days = [7, 30, 90, 365].includes(Number(rawDays)) ? Number(rawDays) : 30; const now = new Date(); const since = new Date(now.getTime() - days * 86400000);
  const tenantWhere = tenantCrmWhere(session.activeOrgId ?? "", session.membershipScope);
  const scope: Prisma.CrmActivityWhereInput = platform ? { scopeOrgId: null, OR: [{ leadId: { not: null } }, { customerOrg: { deletedAt: null } }] } : { scopeOrgId: session.activeOrgId!, tenant: tenantWhere };
  const [activities, open, overdue, completed, customers] = await Promise.all([
    prisma.crmActivity.groupBy({ by: ["kind"], where: { ...scope, createdAt: { gte: since } }, _count: true }),
    prisma.crmActivity.count({ where: { ...scope, completedAt: null, dueAt: { not: null } } }),
    prisma.crmActivity.count({ where: { ...scope, completedAt: null, dueAt: { lt: now } } }),
    prisma.crmActivity.count({ where: { ...scope, completedAt: { gte: since } } }),
    platform ? prisma.organization.count({ where: { deletedAt: null } }) : prisma.tenant.count({ where: tenantWhere }),
  ]);
  const [sales, sources, pipeline, plans, tenants, rentals] = await Promise.all([
    platform ? prisma.onboardingRequest.groupBy({ by: ["salesStage"], where: { createdAt: { gte: since } }, _count: true }) : Promise.resolve([]),
    platform ? prisma.onboardingRequest.groupBy({ by: ["source"], where: { createdAt: { gte: since } }, _count: true, orderBy: { _count: { source: "desc" } }, take: 15 }) : Promise.resolve([]),
    platform ? prisma.onboardingRequest.groupBy({ by: ["currencyCode"], where: { salesStage: { notIn: ["WON", "LOST"] } }, _sum: { expectedMonthlyValue: true }, _count: true }) : Promise.resolve([]),
    platform ? prisma.subscription.groupBy({ by: ["plan", "status"], where: { org: { deletedAt: null } }, _count: true }) : Promise.resolve([]),
    platform ? [] : prisma.tenant.groupBy({ by: ["status"], where: tenantWhere, _count: true }),
    platform ? [] : prisma.vacancyInquiry.groupBy({ by: ["status"], where: { orgId: session.activeOrgId!, unit: scopedUnitWhere(session.activeOrgId!, session.membershipScope), createdAt: { gte: since } }, _count: true })
  ]);
  const won = sales.find(s => s.salesStage === "WON")?._count ?? 0; const lost = sales.find(s => s.salesStage === "LOST")?._count ?? 0;
  return { days, activities, open, overdue, completed, customers, sales, sources, pipeline, plans, tenants, rentals, won, lost };
}
