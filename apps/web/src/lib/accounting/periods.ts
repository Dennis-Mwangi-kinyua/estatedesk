import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";
import { buildMonthlyPeriods } from "@/lib/accounting/period-policy";

export {
  buildMonthlyPeriods,
  nextPeriodStatus,
  periodMonthLabel,
} from "@/lib/accounting/period-policy";

type AccountingDb = PrismaClient | Prisma.TransactionClient;

export type PeriodCloseChecklist = {
  draftJournals: number;
  unpostedPayments: number;
  openBills: number;
  canClose: boolean;
  blockers: string[];
};

export async function ensureFiscalYearPeriods(
  db: AccountingDb,
  orgId: string,
  year: number,
  fiscalYearStartMonth: number,
) {
  const periods = buildMonthlyPeriods(year, fiscalYearStartMonth);

  for (const period of periods) {
    await db.accountingPeriod.upsert({
      where: {
        orgId_startsAt_endsAt: {
          orgId,
          startsAt: period.startsAt,
          endsAt: period.endsAt,
        },
      },
      update: { name: period.name },
      create: {
        orgId,
        name: period.name,
        startsAt: period.startsAt,
        endsAt: period.endsAt,
      },
    });
  }

  return periods;
}

export async function getPeriodCloseChecklist(
  db: AccountingDb,
  orgId: string,
  periodId: string,
): Promise<PeriodCloseChecklist> {
  const period = await db.accountingPeriod.findFirst({
    where: { id: periodId, orgId },
    select: { startsAt: true, endsAt: true, status: true },
  });

  if (!period) {
    throw new Error("Accounting period was not found.");
  }

  const [draftJournals, openBills, verifiedPayments, postedPaymentJournals] =
    await Promise.all([
      db.accountingJournalEntry.count({
        where: {
          orgId,
          status: "DRAFT",
          entryDate: { gte: period.startsAt, lte: period.endsAt },
        },
      }),
      db.accountingVendorBill.count({
        where: {
          orgId,
          status: { in: ["APPROVED", "PARTIAL"] },
          billDate: { gte: period.startsAt, lte: period.endsAt },
        },
      }),
      db.payment.findMany({
        where: {
          orgId,
          verificationStatus: { in: ["VERIFIED", "NOT_REQUIRED"] },
          paidAt: { gte: period.startsAt, lte: period.endsAt },
        },
        select: { id: true },
      }),
      db.accountingJournalEntry.findMany({
        where: { orgId, sourceType: "PAYMENT", sourceId: { not: null } },
        select: { sourceId: true },
      }),
    ]);

  const postedPaymentIds = new Set(
    postedPaymentJournals
      .map((entry) => entry.sourceId)
      .filter((id): id is string => Boolean(id)),
  );
  const unpostedPayments = verifiedPayments.filter(
    (payment) => !postedPaymentIds.has(payment.id),
  ).length;

  const blockers: string[] = [];
  if (draftJournals > 0) {
    blockers.push(`${draftJournals} draft journal(s) in this period`);
  }
  if (unpostedPayments > 0) {
    blockers.push(`${unpostedPayments} verified payment(s) not posted to GL`);
  }

  return {
    draftJournals,
    unpostedPayments,
    openBills,
    canClose:
      blockers.length === 0 &&
      (period.status === "OPEN" || period.status === "LOCKED"),
    blockers,
  };
}

