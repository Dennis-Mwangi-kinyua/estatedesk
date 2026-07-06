import "server-only";

import type { PrismaClient } from "@prisma/client";

export type LedgerSummaryRow = {
  code: string;
  name: string;
  type: string;
  systemKey: string | null;
  debit: number;
  credit: number;
  balance: number;
};

function signedBalance(type: string, debit: number, credit: number) {
  if (type === "ASSET" || type === "EXPENSE") {
    return debit - credit;
  }

  return credit - debit;
}

export async function getFinancialSummary(
  db: PrismaClient,
  orgId: string,
  from: Date,
  to: Date,
) {
  const lines = await db.accountingJournalLine.findMany({
    where: {
      orgId,
      journal: {
        status: { in: ["POSTED", "REVERSED"] },
        entryDate: { lte: to },
      },
    },
    select: {
      debit: true,
      credit: true,
      journal: { select: { entryDate: true } },
      account: {
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          systemKey: true,
        },
      },
    },
  });

  const accounts = new Map<
    string,
    {
      code: string;
      name: string;
      type: string;
      systemKey: string | null;
      debit: number;
      credit: number;
    }
  >();

  for (const line of lines) {
    if (
      ["INCOME", "EXPENSE"].includes(line.account.type) &&
      line.journal.entryDate < from
    ) {
      continue;
    }

    const current = accounts.get(line.account.id) ?? {
      code: line.account.code,
      name: line.account.name,
      type: line.account.type,
      systemKey: line.account.systemKey,
      debit: 0,
      credit: 0,
    };
    current.debit += Number(line.debit);
    current.credit += Number(line.credit);
    accounts.set(line.account.id, current);
  }

  const rows: LedgerSummaryRow[] = [...accounts.values()]
    .map((row) => ({
      ...row,
      balance: signedBalance(row.type, row.debit, row.credit),
    }))
    .sort((a, b) => a.code.localeCompare(b.code));

  const sumByType = (type: string) =>
    rows
      .filter((row) => row.type === type)
      .reduce((sum, row) => sum + row.balance, 0);

  const balanceForKey = (systemKey: string) =>
    rows.find((row) => row.systemKey === systemKey)?.balance ?? 0;

  const income = sumByType("INCOME");
  const expenses = sumByType("EXPENSE");
  const assets = sumByType("ASSET");
  const liabilities = sumByType("LIABILITY");
  const equity = sumByType("EQUITY");

  return {
    rows,
    income,
    expenses,
    netIncome: income - expenses,
    assets,
    liabilities,
    equity,
    cashTotal:
      balanceForKey("BANK") + balanceForKey("MPESA") + balanceForKey("CASH"),
    controlBalances: {
      bank: balanceForKey("BANK"),
      mpesa: balanceForKey("MPESA"),
      cash: balanceForKey("CASH"),
      receivables: balanceForKey("TENANT_RECEIVABLES"),
      payables: balanceForKey("ACCOUNTS_PAYABLE"),
      deposits: balanceForKey("TENANT_DEPOSITS"),
      taxPayable: balanceForKey("TAX_PAYABLE"),
      rentIncome: balanceForKey("RENT_INCOME"),
      waterIncome: balanceForKey("WATER_INCOME"),
    },
  };
}
