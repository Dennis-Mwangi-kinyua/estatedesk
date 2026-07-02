import type { BillStatus, Prisma } from "@prisma/client";

const PAYABLE_WATER_BILL_STATUSES = new Set<BillStatus>([
  "ISSUED",
  "PAYMENT_PENDING",
  "PAID_PENDING_VERIFICATION",
  "DISPUTED",
]);

export function isPayableWaterBillStatus(status: BillStatus) {
  return PAYABLE_WATER_BILL_STATUSES.has(status);
}

export function isOutstandingWaterBillStatus(status: BillStatus) {
  return isPayableWaterBillStatus(status);
}

export function getWaterBillOutstandingAmount(
  status: BillStatus,
  total: Prisma.Decimal | number | null | undefined,
) {
  if (!isOutstandingWaterBillStatus(status)) return 0;

  if (total == null) return 0;

  return typeof total === "number" ? total : total.toNumber();
}