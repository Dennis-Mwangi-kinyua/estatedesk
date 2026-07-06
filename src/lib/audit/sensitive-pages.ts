import "server-only";

import type { AppSession } from "@/lib/auth/session";
import { writeAuditLog, writePlatformAuditLog } from "@/lib/audit/security";
import { shouldAuditSensitivePageView } from "@/lib/audit/sensitive-page-audit";
import { getSensitivePageCategory } from "@/lib/audit/sensitive-page-rules";

export { getSensitivePageCategory } from "@/lib/audit/sensitive-page-rules";

export async function auditSensitivePageView(session: AppSession, pathname: string) {
  if (!shouldAuditSensitivePageView(pathname)) return;

  const category = getSensitivePageCategory(pathname);
  if (!category) return;

  const metadata = {
    pathname,
    category,
    activeOrgRole: session.activeOrgRole,
    platformRole: session.platformRole,
  };

  if (session.activeOrgId) {
    await writeAuditLog({
      orgId: session.activeOrgId,
      actorUserId: session.userId,
      action: "SENSITIVE_PAGE_VIEWED",
      entityType: "Route",
      entityId: pathname,
      metadata,
    });
    return;
  }

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "SENSITIVE_PAGE_VIEWED",
    entityType: "Route",
    entityId: pathname,
    metadata,
  });
}