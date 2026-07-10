import "server-only";

import { Prisma, type ChargeType, type PrismaClient } from "@prisma/client";
import { postJournalEntry } from "@/lib/accounting/engine";
import { getAccountingSettings, usesAccrualRecognition } from "@/lib/accounting/settings";

type AccountingDb = PrismaClient | Prisma.TransactionClient;

function incomeSystemKeyForChargeType(chargeType: ChargeType) {
  switch (chargeType) {
    case "RENT":
      return "RENT_INCOME";
    case "WATER":
      return "WATER_INCOME";
    case "SERVICE_CHARGE":
      return "SERVICE_INCOME";
    case "DEPOSIT":
      return "TENANT_DEPOSITS";
    case "PENALTY":
    case "OTHER":
    default:
      return "OTHER_INCOME";
  }
}

async function accountingIsReady(db: AccountingDb, orgId: string) {
  const accountCount = await db.accountingAccount.count({ where: { orgId, isActive: true } });
  return accountCount > 0;
}

export async function postRentChargeAccrual(
  db: AccountingDb,
  chargeId: string,
  userId?: string | null,
) {
  const charge = await db.rentCharge.findUniqueOrThrow({
    where: { id: chargeId },
    include: {
      lease: {
        select: {
          unitId: true,
          tenantId: true,
          unit: { select: { propertyId: true } },
        },
      },
    },
  });

  if (charge.journalEntryId) {
    return db.accountingJournalEntry.findUnique({ where: { id: charge.journalEntryId } });
  }

  const settings = await getAccountingSettings(db, charge.orgId);
  if (!usesAccrualRecognition(settings) || !settings.autoPostBilling) {
    return null;
  }

  if (!(await accountingIsReady(db, charge.orgId))) {
    return null;
  }

  const amount = charge.amountDue;
  if (new Prisma.Decimal(amount).lte(0)) {
    return null;
  }

  const creditKey = incomeSystemKeyForChargeType(charge.chargeType);
  const unit = charge.lease.unit;
  const dimensions = {
    propertyId: unit?.propertyId,
    unitId: charge.lease.unitId,
    tenantId: charge.lease.tenantId,
  };
  const lines = [
    { systemKey: "TENANT_RECEIVABLES" as const, debit: amount, ...dimensions },
    { systemKey: creditKey, credit: amount, ...dimensions },
  ];

  const entry = await postJournalEntry({
    db,
    orgId: charge.orgId,
    entryDate: charge.dueDate,
    description: `${charge.chargeType} charge accrued · ${charge.period}`,
    memo: charge.description,
    sourceType: "RENT_CHARGE_ACCRUAL",
    sourceId: charge.id,
    userId,
    lines,
  });

  await db.rentCharge.update({
    where: { id: charge.id },
    data: { journalEntryId: entry.id },
  });

  return entry;
}

export async function postWaterBillAccrual(
  db: AccountingDb,
  billId: string,
  userId?: string | null,
) {
  const bill = await db.waterBill.findUniqueOrThrow({
    where: { id: billId },
    include: {
      unit: { select: { propertyId: true } },
    },
  });

  if (bill.journalEntryId) {
    return db.accountingJournalEntry.findUnique({ where: { id: bill.journalEntryId } });
  }

  if (
    bill.status !== "ISSUED" &&
    bill.status !== "PAYMENT_PENDING" &&
    bill.status !== "DISPUTED"
  ) {
    return null;
  }

  const settings = await getAccountingSettings(db, bill.orgId);
  if (!usesAccrualRecognition(settings) || !settings.autoPostBilling) {
    return null;
  }

  if (!(await accountingIsReady(db, bill.orgId))) {
    return null;
  }

  const amount = bill.total;
  if (new Prisma.Decimal(amount).lte(0)) {
    return null;
  }

  const entry = await postJournalEntry({
    db,
    orgId: bill.orgId,
    entryDate: bill.dueDate,
    description: `Water bill accrued · ${bill.period}`,
    memo: bill.notes,
    sourceType: "WATER_BILL_ACCRUAL",
    sourceId: bill.id,
    userId,
    lines: [
      {
        systemKey: "TENANT_RECEIVABLES",
        debit: amount,
        propertyId: bill.unit.propertyId,
        unitId: bill.unitId,
        tenantId: bill.tenantId,
      },
      {
        systemKey: "WATER_INCOME",
        credit: amount,
        propertyId: bill.unit.propertyId,
        unitId: bill.unitId,
        tenantId: bill.tenantId,
      },
    ],
  });

  await db.waterBill.update({
    where: { id: bill.id },
    data: { journalEntryId: entry.id },
  });

  return entry;
}