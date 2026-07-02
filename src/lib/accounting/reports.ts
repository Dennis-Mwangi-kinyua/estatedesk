import "server-only";

import type { PrismaClient } from "@prisma/client";

export async function getFinancialSummary(db: PrismaClient, orgId: string, from: Date, to: Date) {
  const lines = await db.accountingJournalLine.findMany({
    where: { orgId, journal: { status: { in: ["POSTED", "REVERSED"] }, entryDate: { lte: to } } },
    select: { debit: true, credit: true, journal: { select: { entryDate: true } }, account: { select: { id: true, code: true, name: true, type: true } } },
  });
  const accounts = new Map<string, { code: string; name: string; type: string; debit: number; credit: number }>();
  for (const line of lines) {
    if (["INCOME", "EXPENSE"].includes(line.account.type) && line.journal.entryDate < from) continue;
    const current = accounts.get(line.account.id) ?? { code: line.account.code, name: line.account.name, type: line.account.type, debit: 0, credit: 0 };
    current.debit += Number(line.debit);
    current.credit += Number(line.credit);
    accounts.set(line.account.id, current);
  }
  const rows = [...accounts.values()].sort((a, b) => a.code.localeCompare(b.code));
  const income = rows.filter((row) => row.type === "INCOME").reduce((sum, row) => sum + row.credit - row.debit, 0);
  const expenses = rows.filter((row) => row.type === "EXPENSE").reduce((sum, row) => sum + row.debit - row.credit, 0);
  const assets = rows.filter((row) => row.type === "ASSET").reduce((sum, row) => sum + row.debit - row.credit, 0);
  const liabilities = rows.filter((row) => row.type === "LIABILITY").reduce((sum, row) => sum + row.credit - row.debit, 0);
  return { rows, income, expenses, netIncome: income - expenses, assets, liabilities };
}
