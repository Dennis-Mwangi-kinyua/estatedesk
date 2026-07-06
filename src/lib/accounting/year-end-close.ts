import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";
import {
  getPeriodIncomeExpenseBalances,
  postPeriodCloseEntries,
} from "@/lib/accounting/period-close";
import { periodCloseSourceId } from "@/lib/accounting/period-close-policy";
import { ensureFiscalYearPeriods, getPeriodCloseChecklist } from "@/lib/accounting/periods";
import { getAccountingSettings } from "@/lib/accounting/settings";
import {
  fiscalYearRange,
  periodWithinFiscalYear,
} from "@/lib/accounting/year-end-close-policy";

type AccountingDb = PrismaClient | Prisma.TransactionClient;

async function hasClosingEntry(db: AccountingDb, orgId: string, periodId: string) {
  const entry = await db.accountingJournalEntry.findUnique({
    where: {
      orgId_sourceType_sourceId: {
        orgId,
        sourceType: "ADJUSTMENT",
        sourceId: periodCloseSourceId(periodId),
      },
    },
    select: { id: true },
  });

  return Boolean(entry);
}

export async function getYearEndClosePreview(
  db: AccountingDb,
  orgId: string,
  fiscalYear: number,
) {
  const settings = await getAccountingSettings(db, orgId);
  const range = fiscalYearRange(fiscalYear, settings.fiscalYearStartMonth);

  const periods = await db.accountingPeriod.findMany({
    where: { orgId },
    orderBy: { startsAt: "asc" },
  });

  const fiscalPeriods = periods.filter((period) => periodWithinFiscalYear(period, range));
  const previews = await Promise.all(
    fiscalPeriods.map(async (period) => {
      const [checklist, closingPosted, activityCount] = await Promise.all([
        getPeriodCloseChecklist(db, orgId, period.id),
        hasClosingEntry(db, orgId, period.id),
        getPeriodIncomeExpenseBalances(db, orgId, period.startsAt, period.endsAt).then(
          (rows) => rows.length,
        ),
      ]);

      return {
        id: period.id,
        name: period.name,
        status: period.status,
        startsAt: period.startsAt,
        endsAt: period.endsAt,
        checklist,
        closingPosted,
        hasActivity: activityCount > 0,
      };
    }),
  );

  const blockers = previews.flatMap((period) =>
    period.status !== "CLOSED" && period.checklist.blockers.length > 0
      ? [`${period.name}: ${period.checklist.blockers.join(", ")}`]
      : [],
  );

  return {
    fiscalYear,
    range,
    periods: previews,
    canRun: blockers.length === 0 && previews.length > 0,
    blockers,
    pendingClose: previews.filter((period) => period.status !== "CLOSED").length,
    pendingClosingEntries: previews.filter(
      (period) => period.hasActivity && !period.closingPosted,
    ).length,
  };
}

export async function runYearEndClose(
  db: AccountingDb,
  orgId: string,
  fiscalYear: number,
  userId?: string | null,
  options?: { openNextYear?: boolean },
) {
  const preview = await getYearEndClosePreview(db, orgId, fiscalYear);
  if (!preview.canRun) {
    throw new Error(preview.blockers.join("; ") || "No fiscal periods found for year-end close.");
  }

  const settings = await getAccountingSettings(db, orgId);

  let locked = 0;
  let closingPosted = 0;
  let closed = 0;
  let skipped = 0;

  await db.$transaction(async (tx) => {
    await ensureFiscalYearPeriods(tx, orgId, fiscalYear, settings.fiscalYearStartMonth);

    for (const period of preview.periods) {
      let status = period.status;

      if (status === "OPEN") {
        await tx.accountingPeriod.update({
          where: { id: period.id },
          data: { status: "LOCKED" },
        });
        status = "LOCKED";
        locked += 1;
      }

      if (period.hasActivity && !period.closingPosted) {
        const entry = await postPeriodCloseEntries(tx, orgId, period.id, userId);
        if (entry) closingPosted += 1;
      } else if (!period.hasActivity) {
        skipped += 1;
      }

      if (status !== "CLOSED") {
        await tx.accountingPeriod.update({
          where: { id: period.id },
          data: {
            status: "CLOSED",
            closedAt: new Date(),
            closedByUserId: userId,
          },
        });
        closed += 1;
      }
    }

    if (options?.openNextYear !== false) {
      await ensureFiscalYearPeriods(
        tx,
        orgId,
        fiscalYear + 1,
        settings.fiscalYearStartMonth,
      );
    }
  });

  return { locked, closingPosted, closed, skipped, fiscalYear };
}