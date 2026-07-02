import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";
import { postJournalEntry, reverseJournalEntry } from "@/lib/accounting/engine";

type AccountingDb = PrismaClient | Prisma.TransactionClient;

export async function postVerifiedPayment(db: AccountingDb, paymentId: string, userId?: string | null) {
  const payment = await db.payment.findUniqueOrThrow({
    where: { id: paymentId },
    include: {
      rentCharge: { include: { lease: { select: { unitId: true } } } },
      waterBill: { select: { unitId: true } },
    },
  });
  const unitId = payment.waterBill?.unitId ?? payment.rentCharge?.lease.unitId ?? null;
  const unit = unitId ? await db.unit.findUnique({ where: { id: unitId }, select: { propertyId: true } }) : null;
  const cashKey = payment.method.startsWith("MPESA") ? "MPESA" : payment.method === "CASH" ? "CASH" : "BANK";
  const creditKey = payment.targetType === "DEPOSIT"
    ? "TENANT_DEPOSITS"
    : payment.targetType === "RENT"
      ? "RENT_INCOME"
      : payment.targetType === "WATER"
        ? "WATER_INCOME"
        : "OTHER_INCOME";
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
      { systemKey: cashKey, debit: payment.amount, propertyId: unit?.propertyId, unitId, tenantId: payment.payerTenantId },
      { systemKey: creditKey, credit: payment.amount, propertyId: unit?.propertyId, unitId, tenantId: payment.payerTenantId },
    ],
  });
}

export async function reversePaymentPosting(db: AccountingDb, paymentId: string, reason: string, userId?: string | null) {
  const original = await db.accountingJournalEntry.findUnique({
    where: { orgId_sourceType_sourceId: { orgId: (await db.payment.findUniqueOrThrow({ where: { id: paymentId }, select: { orgId: true } })).orgId, sourceType: "PAYMENT", sourceId: paymentId } },
  });
  if (!original) return null;
  return reverseJournalEntry({ db, orgId: original.orgId, sourceEntryId: original.id, sourceId: paymentId, reason, userId });
}
