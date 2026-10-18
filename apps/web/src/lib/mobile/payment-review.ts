import { Prisma } from "@prisma/client";
import type { AppSession } from "@/lib/auth/session";
/** The native queue only exposes payments with a provable unit in the current scope. */
export function reviewWhere(session: AppSession): Prisma.PaymentWhereInput {
  const scope = session.membershipScope;
  const unit: Prisma.UnitWhereInput = { deletedAt: null, property: { orgId: session.activeOrgId!, deletedAt: null },
    ...(scope?.scopeType === "PROPERTY" ? { propertyId: scope.scopeId } : scope?.scopeType === "BUILDING" ? { buildingId: scope.scopeId } : scope?.scopeType === "UNIT" ? { id: scope.scopeId } : {}) };
  return { orgId: session.activeOrgId!, verificationStatus: "PENDING", method: { in: ["MPESA_MANUAL", "BANK", "CASH"] },
    ...(scope && scope.scopeType !== "ORG" ? { OR: [{ rentCharge: { lease: { unit } } }, { waterBill: { unit } }] } : {}) };
}
