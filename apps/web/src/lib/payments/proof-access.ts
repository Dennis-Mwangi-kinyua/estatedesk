import type { Prisma } from "@prisma/client";
import type { AppSession } from "../auth/session";
import { scopedPaymentWhere } from "../permissions/record-scope";
import { canAccessWorkspacePath } from "../permissions/workspace-access";
import { memberHasOrgPermission } from "../permissions/role-matrix";

export function paymentProofWhere(session: AppSession, paymentId: string): Prisma.PaymentWhereInput | null {
  if (!session.activeOrgId || session.mustChangePassword || session.requiresTermsAcceptance) return null;
  const base = { id: paymentId, orgId: session.activeOrgId };
  if (["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"].includes(session.activeOrgRole ?? "")) {
    if (!canAccessWorkspacePath(session, "/dashboard/org/payments") || !(["payments.record", "payments.verify", "payments.manage"] as const).some(permission => memberHasOrgPermission(session, permission))) return null;
    return { AND: [base, scopedPaymentWhere(session.activeOrgId, session.membershipScope)] };
  }
  if (session.activeOrgRole !== "TENANT" || !canAccessWorkspacePath(session, "/dashboard/tenant/payments")) return null;
  return { ...base, OR: [{ payerUserId: session.userId }, { payerTenant: { userId: session.userId } }] };
}
