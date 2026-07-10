import type { BillStatus, Prisma } from "@prisma/client";

/** Hidden from tenant UIs until org approves the caretaker reading. */
export const TENANT_HIDDEN_WATER_BILL_STATUSES: BillStatus[] = [
  "PENDING_APPROVAL",
  "CANCELLED",
];

const PAYABLE_WATER_BILL_STATUSES = new Set<BillStatus>([
  "ISSUED",
  "PAYMENT_PENDING",
  "PAID_PENDING_VERIFICATION",
  "DISPUTED",
]);

export function isTenantVisibleWaterBillStatus(status: BillStatus) {
  return !TENANT_HIDDEN_WATER_BILL_STATUSES.includes(status);
}

export function tenantVisibleWaterBillWhere(): Pick<
  Prisma.WaterBillWhereInput,
  "status"
> {
  return {
    status: { notIn: TENANT_HIDDEN_WATER_BILL_STATUSES },
  };
}

export function isPayableWaterBillStatus(status: BillStatus) {
  return PAYABLE_WATER_BILL_STATUSES.has(status);
}

export function isOutstandingWaterBillStatus(status: BillStatus) {
  return isPayableWaterBillStatus(status);
}

function toNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value == null) return 0;
  return typeof value === "number" ? value : value.toNumber();
}

/**
 * Remaining water amount due. Prefer stored `balance` after partial payments;
 * fall back to full total while payable.
 */
export function getWaterBillOutstandingAmount(
  status: BillStatus,
  total: Prisma.Decimal | number | null | undefined,
  balance?: Prisma.Decimal | number | null,
  amountPaid?: Prisma.Decimal | number | null,
) {
  if (status === "PAID_VERIFIED" || status === "CANCELLED") return 0;
  if (!isOutstandingWaterBillStatus(status)) return 0;

  if (balance != null) {
    return Math.max(toNumber(balance), 0);
  }

  if (amountPaid != null && total != null) {
    return Math.max(toNumber(total) - toNumber(amountPaid), 0);
  }

  if (total == null) return 0;
  return toNumber(total);
}

export function waterBillStatusAfterPayment(args: {
  previousStatus: BillStatus;
  nextBalance: number;
  pendingVerification?: boolean;
}): BillStatus {
  if (args.nextBalance <= 0) return "PAID_VERIFIED";
  if (args.pendingVerification) return "PAID_PENDING_VERIFICATION";
  if (args.previousStatus === "DISPUTED") return "DISPUTED";
  return "ISSUED";
}
