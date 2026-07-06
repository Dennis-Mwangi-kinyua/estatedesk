import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";
import { postJournalEntry } from "@/lib/accounting/engine";
import {
  buildPeriodCloseLines,
  periodCloseSourceId,
  type PeriodCloseAccountRow,
} from "@/lib/accounting/period-close-policy";

type AccountingDb = PrismaClient | Prisma.TransactionClient;

function signedBalance(type: string, debit: number, credit: number) {
  if (type === "EXPENSE") return debit - credit;
  return credit - debit;
}

export async function getPeriodIncomeExpenseBalances(
  db: AccountingDb,
  orgId: string,
  startsAt: Date,
  endsAt: Date,
) {
  const lines = await db.accountingJournalLine.findMany({
    where: {
      orgId,
      journal: {
        status: { in: ["POSTED", "REVERSED"] },
        entryDate: { gte: startsAt, lte: endsAt },
      },
      account: { type: { in: ["INCOME", "EXPENSE"] } },
    },
    select: {
      debit: true,
      credit: true,
      account: {
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
        },
      },
    },
  });

  const byAccount = new Map<string, PeriodCloseAccountRow>();

  for (const line of lines) {
    const type = line.account.type as "INCOME" | "EXPENSE";
    const current = byAccount.get(line.account.id) ?? {
      accountId: line.account.id,
      code: line.account.code,
      name: line.account.name,
      type,
      balance: 0,
    };
    current.balance += signedBalance(type, Number(line.debit), Number(line.credit));
    byAccount.set(line.account.id, current);
  }

  return [...byAccount.values()].filter((row) => Math.abs(row.balance) >= 0.01);
}

export async function postPeriodCloseEntries(
  db: AccountingDb,
  orgId: string,
  periodId: string,
  userId?: string | null,
) {
  const period = await db.accountingPeriod.findFirst({
    where: { id: periodId, orgId },
  });

  if (!period) {
    throw new Error("Accounting period was not found.");
  }

  if (period.status === "OPEN") {
    throw new Error("Lock the period before posting closing entries.");
  }

  const sourceId = periodCloseSourceId(periodId);
  const existing = await db.accountingJournalEntry.findUnique({
    where: {
      orgId_sourceType_sourceId: {
        orgId,
        sourceType: "ADJUSTMENT",
        sourceId,
      },
    },
  });

  if (existing) {
    return existing;
  }

  const [rows, retainedEarnings] = await Promise.all([
    getPeriodIncomeExpenseBalances(db, orgId, period.startsAt, period.endsAt),
    db.accountingAccount.findFirst({
      where: { orgId, systemKey: "RETAINED_EARNINGS", isActive: true },
      select: { id: true },
    }),
  ]);

  if (!retainedEarnings) {
    throw new Error("Retained earnings account is not configured.");
  }

  if (rows.length === 0) {
    return null;
  }

  const lineDrafts = buildPeriodCloseLines(rows, retainedEarnings.id, period.name);
  if (lineDrafts.length < 2) {
    throw new Error("Closing entry could not be built.");
  }

  return postJournalEntry({
    db,
    orgId,
    entryDate: period.endsAt,
    description: `Period close: ${period.name}`,
    memo: "Retained earnings roll-forward",
    sourceType: "ADJUSTMENT",
    sourceId,
    userId,
    lines: lineDrafts.map((line) => ({
      accountId: line.accountId,
      description: line.description,
      debit: line.debit,
      credit: line.credit,
    })),
  });
}