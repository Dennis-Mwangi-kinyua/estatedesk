import "server-only";

import type { PrismaClient } from "@prisma/client";

export type ReceivableAgingBucket = "current" | "1-30" | "31-60" | "61-90" | "90+";

export type TenantReceivableRow = {
  tenantId: string;
  tenantName: string;
  unitLabel: string;
  source: "RENT" | "WATER";
  reference: string;
  dueDate: Date;
  amountDue: number;
  amountPaid: number;
  balance: number;
  daysPastDue: number;
  bucket: ReceivableAgingBucket;
  glPosted: boolean;
};

function agingBucket(daysPastDue: number): ReceivableAgingBucket {
  if (daysPastDue <= 0) return "current";
  if (daysPastDue <= 30) return "1-30";
  if (daysPastDue <= 60) return "31-60";
  if (daysPastDue <= 90) return "61-90";
  return "90+";
}

function daysPastDue(dueDate: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today.getTime() - due.getTime()) / (24 * 60 * 60 * 1000)));
}

export async function getTenantReceivablesReport(db: PrismaClient, orgId: string) {
  const [rentCharges, waterBills] = await Promise.all([
    db.rentCharge.findMany({
      where: {
        orgId,
        balance: { gt: 0 },
        status: { in: ["UNPAID", "PARTIAL", "OVERDUE"] },
      },
      include: {
        lease: {
          select: {
            tenant: { select: { id: true, fullName: true } },
            unit: {
              select: {
                houseNo: true,
                property: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { dueDate: "asc" },
    }),
    db.waterBill.findMany({
      where: {
        orgId,
        status: { in: ["ISSUED", "PAYMENT_PENDING", "DISPUTED", "PAID_PENDING_VERIFICATION"] },
      },
      include: {
        tenant: { select: { id: true, fullName: true } },
        unit: {
          select: {
            houseNo: true,
            property: { select: { name: true } },
          },
        },
        payments: {
          select: { amount: true },
        },
      },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  const rows: TenantReceivableRow[] = [];

  for (const charge of rentCharges) {
    const pastDue = daysPastDue(charge.dueDate);
    const unit = charge.lease.unit;
    rows.push({
      tenantId: charge.lease.tenant.id,
      tenantName: charge.lease.tenant.fullName,
      unitLabel: unit
        ? `${unit.property.name} · ${unit.houseNo}`
        : "Unassigned unit",
      source: "RENT",
      reference: `${charge.chargeType} · ${charge.period}`,
      dueDate: charge.dueDate,
      amountDue: Number(charge.amountDue),
      amountPaid: Number(charge.amountPaid),
      balance: Number(charge.balance),
      daysPastDue: pastDue,
      bucket: agingBucket(pastDue),
      glPosted: Boolean(charge.journalEntryId),
    });
  }

  for (const bill of waterBills) {
    const paid = bill.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const balance = Math.max(0, Number(bill.total) - paid);
    if (balance <= 0) continue;

    const pastDue = daysPastDue(bill.dueDate);
    rows.push({
      tenantId: bill.tenant.id,
      tenantName: bill.tenant.fullName,
      unitLabel: `${bill.unit.property.name} · ${bill.unit.houseNo}`,
      source: "WATER",
      reference: `Water · ${bill.period}`,
      dueDate: bill.dueDate,
      amountDue: Number(bill.total),
      amountPaid: paid,
      balance,
      daysPastDue: pastDue,
      bucket: agingBucket(pastDue),
      glPosted: Boolean(bill.journalEntryId),
    });
  }

  const totalBalance = rows.reduce((sum, row) => sum + row.balance, 0);
  const bucketTotals = rows.reduce<Record<ReceivableAgingBucket, number>>(
    (totals, row) => {
      totals[row.bucket] += row.balance;
      return totals;
    },
    { current: 0, "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 },
  );

  return {
    rows: rows.sort((a, b) => b.balance - a.balance),
    totalBalance,
    bucketTotals,
    glReceivableBalance: null as number | null,
  };
}