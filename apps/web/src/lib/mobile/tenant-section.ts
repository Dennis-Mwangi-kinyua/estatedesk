import type { AppSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { canAccessWorkspacePath } from "@/lib/permissions/workspace-access";
import { tenantPathRequiresActiveLease } from "@/lib/permissions/access";

/** API paths must enforce the same section and lease rules as the web pathname. */
export async function nativeTenantSection(session: AppSession, path: string) {
  if (!canAccessWorkspacePath(session, path)) return false;
  if (!tenantPathRequiresActiveLease(path)) return true;
  return !!await prisma.lease.findFirst({ where: {
    orgId: session.activeOrgId!, status: "ACTIVE", deletedAt: null,
    tenant: { userId: session.userId, deletedAt: null },
  }, select: { id: true } });
}
