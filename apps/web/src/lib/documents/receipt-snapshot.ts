import type { Prisma, PrismaClient } from "@prisma/client";
import {
  buildEtimsReadyReceiptFields,
  formatEtimsFooterSummary,
} from "@/lib/tax/etims-receipt";

type DocumentDb = PrismaClient | Prisma.TransactionClient;

export type ReceiptAllocationSnapshot = {
  period: string;
  description: string;
  amount: number;
};

export type ReceiptSnapshot = {
  organizationName: string;
  organizationAddress: string | null;
  organizationPhone: string | null;
  organizationEmail: string | null;
  kraPin: string | null;
  tenantKraPin: string | null;
  etimsControlUnitSerial: string | null;
  etimsFooter: string | null;
  etimsReadyForSubmission: boolean;
  payerName: string;
  tenantIdentifier: string | null;
  amount: number;
  currencyCode: string;
  paymentMethod: string;
  paymentFor: string;
  paymentReference: string | null;
  paidAt: string;
  propertyName: string | null;
  unitName: string | null;
  leaseIdentifier: string | null;
  periods: string[];
  allocations: ReceiptAllocationSnapshot[];
  previousBalance: number | null;
  remainingBalance: number | null;
  verifiedBy: string | null;
};

export async function createReceiptSnapshot(
  db: DocumentDb,
  paymentId: string,
  verifiedByUserId?: string | null,
): Promise<ReceiptSnapshot> {
  const payment = await db.payment.findUniqueOrThrow({
    where: { id: paymentId },
    include: {
      org: { select: { name: true, address: true, phone: true, email: true, currencyCode: true } },
      payerTenant: { select: { id: true, fullName: true, kraPin: true } },
      payerUser: { select: { fullName: true } },
      allocations: {
        include: {
          rentCharge: {
            include: {
              lease: { include: { unit: { include: { property: { include: { taxpayerProfile: true } } } } } },
            },
          },
        },
        orderBy: { period: "asc" },
      },
      rentCharge: {
        include: {
          lease: { include: { unit: { include: { property: { include: { taxpayerProfile: true } } } } } },
        },
      },
      waterBill: {
        include: { unit: { include: { property: { include: { taxpayerProfile: true } } } } },
      },
      taxCharge: {
        include: {
          property: { include: { taxpayerProfile: true } },
          lease: { include: { unit: { include: { property: { include: { taxpayerProfile: true } } } } } },
        },
      },
    },
  });

  const verifiedBy = verifiedByUserId
    ? await db.user.findUnique({ where: { id: verifiedByUserId }, select: { fullName: true } })
    : null;
  const allocationLease = payment.allocations[0]?.rentCharge.lease;
  const lease = payment.rentCharge?.lease ?? payment.taxCharge?.lease ?? allocationLease;
  const unit = payment.waterBill?.unit ?? lease?.unit;
  const property = payment.taxCharge?.property ?? unit?.property;
  const allocations = payment.allocations.map((allocation) => ({
    period: allocation.period,
    description: allocation.rentCharge.description ?? allocation.rentCharge.chargeType,
    amount: Number(allocation.amount),
  }));
  if (!allocations.length && payment.waterBill) {
    allocations.push({ period: payment.waterBill.period, description: "Water bill", amount: Number(payment.amount) });
  }
  if (!allocations.length && payment.taxCharge) {
    allocations.push({ period: payment.taxCharge.period, description: payment.taxCharge.taxType, amount: Number(payment.amount) });
  }
  const allocatedCharges = [...new Map(
    payment.allocations.map((allocation) => [allocation.rentCharge.id, allocation.rentCharge]),
  ).values()];
  const remainingBalance = payment.rentCharge
    ? Number(payment.rentCharge.balance)
    : allocatedCharges.length
      ? allocatedCharges.reduce((sum, charge) => sum + Number(charge.balance), 0)
      : null;
  const allocatedAmount = allocations.reduce((sum, allocation) => sum + allocation.amount, 0);

  const kraPin = property?.taxpayerProfile?.kraPin ?? null;
  const tenantKraPin = payment.payerTenant?.kraPin ?? null;
  const etimsControlUnitSerial =
    process.env.KRA_ETIMS_CU_SERIAL?.trim() || null;
  const serialHint =
    payment.externalReference ??
    payment.reference ??
    payment.checkoutRequestId ??
    payment.id;
  const etims = buildEtimsReadyReceiptFields({
    serialNumber: String(serialHint),
    organizationKraPin: kraPin,
    tenantKraPin,
    amount: Number(payment.amount),
    currencyCode: payment.org.currencyCode,
    paymentFor: payment.targetType,
    allocations,
    controlUnitSerial: etimsControlUnitSerial,
    issuedAt: payment.paidAt ?? payment.createdAt,
  });

  return {
    organizationName: payment.org.name,
    organizationAddress: payment.org.address,
    organizationPhone: payment.org.phone,
    organizationEmail: payment.org.email,
    kraPin,
    tenantKraPin,
    etimsControlUnitSerial,
    etimsFooter: formatEtimsFooterSummary(etims),
    etimsReadyForSubmission: etims.readyForSubmission,
    payerName: payment.payerTenant?.fullName ?? payment.payerUser?.fullName ?? payment.payerName ?? "Payer",
    tenantIdentifier: payment.payerTenant?.id ?? null,
    amount: Number(payment.amount),
    currencyCode: payment.org.currencyCode,
    paymentMethod: payment.method,
    paymentFor: payment.targetType,
    paymentReference: payment.externalReference ?? payment.reference ?? payment.checkoutRequestId,
    paidAt: (payment.paidAt ?? payment.createdAt).toISOString(),
    propertyName: property?.name ?? null,
    unitName: unit?.houseNo ?? null,
    leaseIdentifier: lease?.id ?? null,
    periods: [...new Set(allocations.map((allocation) => allocation.period))],
    allocations,
    previousBalance: remainingBalance === null ? null : remainingBalance + allocatedAmount,
    remainingBalance,
    verifiedBy: verifiedBy?.fullName ?? null,
  };
}

export function readReceiptSnapshot(metadata: Prisma.JsonValue | null | undefined) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const snapshot = (metadata as Record<string, Prisma.JsonValue>).receiptSnapshot;
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;
  return snapshot as unknown as ReceiptSnapshot;
}
