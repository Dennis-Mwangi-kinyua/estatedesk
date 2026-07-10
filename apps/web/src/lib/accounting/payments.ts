import "server-only";

import type { PaymentTargetType, Prisma, PrismaClient } from "@prisma/client";
import { postJournalEntry, reverseJournalEntry } from "@/lib/accounting/engine";
import { getAccountingSettings, usesAccrualRecognition } from "@/lib/accounting/settings";

type AccountingDb = PrismaClient | Prisma.TransactionClient;

function cashSystemKey(method: string) {
  return method.startsWith("MPESA") ? "MPESA" : method === "CASH" ? "CASH" : "BANK";
}

function incomeSystemKey(targetType: PaymentTargetType) {
  switch (targetType) {
    case "DEPOSIT":
      return "TENANT_DEPOSITS";
    case "RENT":
    case "COMBINED":
      // Combined period bills are primarily rent-led; water portion still reduces water balance.
      return "RENT_INCOME";
    case "WATER":
      return "WATER_INCOME";
    default:
      return "OTHER_INCOME";
  }
}

function creditSystemKey(
  targetType: PaymentTargetType,
  settings: Awaited<ReturnType<typeof getAccountingSettings>>,
) {
  if (targetType === "DEPOSIT") {
    return "TENANT_DEPOSITS";
  }

  if (usesAccrualRecognition(settings)) {
    return "TENANT_RECEIVABLES";
  }

  return incomeSystemKey(targetType);
}

export async function postVerifiedPayment(db: AccountingDb, paymentId: string, userId?: string | null) {
  const payment = await db.payment.findUniqueOrThrow({
    where: { id: paymentId },
    include: {
      rentCharge: { include: { lease: { select: { unitId: true, tenantId: true } } } },
      waterBill: { select: { unitId: true, tenantId: true } },
    },
  });

  const settings = await getAccountingSettings(db, payment.orgId);
  if (!settings.autoPostPayments) {
    return null;
  }

  const unitId = payment.waterBill?.unitId ?? payment.rentCharge?.lease.unitId ?? null;
  const tenantId =
    payment.payerTenantId ??
    payment.waterBill?.tenantId ??
    payment.rentCharge?.lease.tenantId ??
    null;
  const unit = unitId
    ? await db.unit.findUnique({ where: { id: unitId }, select: { propertyId: true } })
    : null;

  return postJournalEntry({
    db,
    orgId: payment.orgId,
    entryDate: payment.paidAt ?? payment.createdAt,
    description: `${payment.targetType} payment received`,
    memo: payment.externalReference ?? payment.reference ?? payment.checkoutRequestId,
    sourceType: "PAYMENT",
    sourceId: payment.id,
    userId,
    lines: [
      {
        systemKey: cashSystemKey(payment.method),
        debit: payment.amount,
        propertyId: unit?.propertyId,
        unitId,
        tenantId,
      },
      {
        systemKey: creditSystemKey(payment.targetType, settings),
        credit: payment.amount,
        propertyId: unit?.propertyId,
        unitId,
        tenantId,
      },
    ],
  });
}

export async function reversePaymentPosting(db: AccountingDb, paymentId: string, reason: string, userId?: string | null) {
  const payment = await db.payment.findUniqueOrThrow({
    where: { id: paymentId },
    select: { orgId: true },
  });

  const original = await db.accountingJournalEntry.findUnique({
    where: {
      orgId_sourceType_sourceId: {
        orgId: payment.orgId,
        sourceType: "PAYMENT",
        sourceId: paymentId,
      },
    },
  });

  if (!original) return null;

  return reverseJournalEntry({
    db,
    orgId: original.orgId,
    sourceEntryId: original.id,
    sourceId: paymentId,
    reason,
    userId,
  });
}