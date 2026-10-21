import "server-only";
import type { AppSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { canAccessWorkspacePath } from "@/lib/permissions/workspace-access";
import { canViewAuditLogs } from "@/lib/permissions/access";

export async function canReadVerifiedInvoice(session: AppSession | null, document: { orgId: string; entityType: string; documentType: string; entityId: string; metadata: unknown }) {
  if (!session || session.mustChangePassword || session.requiresTermsAcceptance || document.entityType !== "PeriodBill" || document.documentType !== "INVOICE") return false;
  if (canViewAuditLogs(session.platformRole)) return true;
  if (session.activeOrgId !== document.orgId) return false;
  const metadata = document.metadata as { tenantId?: string } | null;
  const tenantId = metadata?.tenantId || document.entityId.split(":")[0];
  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId, orgId: document.orgId, deletedAt: null, org: { deletedAt: null, status: "ACTIVE" } }, select: { userId: true } });
  if (!tenant) return false;
  const owner = tenant.userId === session.userId && canAccessWorkspacePath(session, "/dashboard/tenant/bills");
  // Period invoices can combine premises; scoped staff use their scoped operational records.
  const management = session.membershipScope?.scopeType === "ORG" && canAccessWorkspacePath(session, "/dashboard/org/payments");
  return owner || management;
}
