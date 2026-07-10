import "server-only";

import type { PrismaClient } from "@prisma/client";
import { computeVariance } from "@/lib/accounting/budget-policy";

export { computeVariance } from "@/lib/accounting/budget-policy";

export type BudgetVarianceRow = {
  accountId: string;
  code: string;
  name: string;
  type: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePct: number | null;
};

export async function getBudgetVariance(
  db: PrismaClient,
  orgId: string,
  budgetId: string,
): Promise<BudgetVarianceRow[]> {
  const budget = await db.accountingBudget.findFirst({
    where: { id: budgetId, orgId },
    include: {
      period: true,
      lines: {
        include: {
          account: { select: { id: true, code: true, name: true, type: true } },
        },
      },
    },
  });

  if (!budget) {
    throw new Error("Budget was not found.");
  }

  const actualLines = await db.accountingJournalLine.findMany({
    where: {
      orgId,
      journal: {
        status: { in: ["POSTED", "REVERSED"] },
        entryDate: {
          gte: budget.period.startsAt,
          lte: budget.period.endsAt,
        },
      },
      account: { type: { in: ["INCOME", "EXPENSE"] } },
    },
    select: {
      debit: true,
      credit: true,
      account: {
        select: { id: true, code: true, name: true, type: true },
      },
    },
  });

  const actualByAccount = new Map<
    string,
    { code: string; name: string; type: string; actual: number }
  >();

  for (const line of actualLines) {
    const signed =
      line.account.type === "EXPENSE"
        ? Number(line.debit) - Number(line.credit)
        : Number(line.credit) - Number(line.debit);
    const current = actualByAccount.get(line.account.id) ?? {
      code: line.account.code,
      name: line.account.name,
      type: line.account.type,
      actual: 0,
    };
    current.actual += signed;
    actualByAccount.set(line.account.id, current);
  }

  const budgetByAccount = new Map(
    budget.lines.map((line) => [
      line.accountId,
      {
        code: line.account.code,
        name: line.account.name,
        type: line.account.type,
        budgeted: Number(line.amount),
      },
    ]),
  );

  const accountIds = new Set([...budgetByAccount.keys(), ...actualByAccount.keys()]);

  return [...accountIds]
    .map((accountId) => {
      const budgeted = budgetByAccount.get(accountId)?.budgeted ?? 0;
      const actualEntry = actualByAccount.get(accountId);
      const actual = actualEntry?.actual ?? 0;
      const meta = budgetByAccount.get(accountId) ?? actualEntry!;
      const { variance, variancePct } = computeVariance(budgeted, actual);

      return {
        accountId,
        code: meta.code,
        name: meta.name,
        type: meta.type,
        budgeted,
        actual,
        variance,
        variancePct,
      };
    })
    .sort((a, b) => a.code.localeCompare(b.code));
}