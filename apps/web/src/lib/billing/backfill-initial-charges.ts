import "server-only";
import type { Prisma } from "@prisma/client";
import { nairobiDate } from "@/lib/move-outs/validation";
import { createInitialLeaseCharges } from "./initial-lease-charges";

// Historical payments may be unallocated or belong to a previous lease. Never
// infer unpaid debt from a missing charge when such history exists.
export async function backfillInitialCharges(db: Prisma.TransactionClient, leaseId: string, apply = false, actorUserId?: string) {
  const lease = await db.lease.findUniqueOrThrow({ where: { id: leaseId }, include: { rentCharges: true, moveOutNotices: { select: { id: true } } } });
  const period = nairobiDate(lease.startDate).slice(0, 7);
  const missing = (["RENT", "DEPOSIT"] as const).filter(type =>
    (type === "RENT" ? lease.monthlyRent : lease.deposit)?.gt(0) &&
    !lease.rentCharges.some(charge => charge.period === period && charge.chargeType === type));
  if (!missing.length) return { leaseId, status: "complete", missing };
  const payments = await db.payment.count({ where: { orgId: lease.orgId, payerTenantId: lease.tenantId } });
  const reason = lease.deletedAt || lease.status !== "ACTIVE" || lease.moveOutNotices.length
    ? "Inactive tenancy or move-out history requires review."
    : payments || lease.rentCharges.some(charge => charge.amountPaid.gt(0) || charge.status === "WAIVED")
      ? "Payment or adjustment history requires review before adding debt." : null;
  if (reason) return { leaseId, status: "review", missing, reason };
  if (apply) {
    if (!actorUserId) throw new Error("An actor user ID is required to apply the backfill.");
    await createInitialLeaseCharges(db, lease, missing);
    await db.auditLog.create({ data: { orgId: lease.orgId, actorUserId, action: "INITIAL_CHARGES_BACKFILLED", entityType: "Lease", entityId: lease.id, metadata: { period, chargeTypes: missing } } });
  }
  return { leaseId, status: apply ? "created" : "eligible", missing };
}
