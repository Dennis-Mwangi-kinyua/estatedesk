import type { Prisma } from "@prisma/client";
import type { AppSession } from "../auth/session";
import { scopedUnitWhere } from "../permissions/record-scope";
import { canAccessWorkspacePath } from "../permissions/workspace-access";

/** Reports and refund evidence share the same live tenancy boundary. */
export function moveOutDocumentWhere(session: AppSession, noticeId: string): Prisma.MoveOutNoticeWhereInput | null {
  if (!session.activeOrgId || session.mustChangePassword || session.requiresTermsAcceptance) return null;
  if (session.activeOrgRole === "TENANT") {
    if (!canAccessWorkspacePath(session, "/dashboard/tenant/move-outs")) return null;
    return { id: noticeId, lease: { orgId: session.activeOrgId }, tenant: { orgId: session.activeOrgId, userId: session.userId, deletedAt: null } };
  }
  if (!["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"].includes(session.activeOrgRole ?? "") || !canAccessWorkspacePath(session, "/dashboard/org/move-outs")) return null;
  return { id: noticeId, lease: { orgId: session.activeOrgId, unit: scopedUnitWhere(session.activeOrgId, session.membershipScope) } };
}
