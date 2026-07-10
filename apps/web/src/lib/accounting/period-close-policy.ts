export type PeriodCloseAccountRow = {
  accountId: string;
  code: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  balance: number;
};

export type PeriodCloseLineDraft = {
  accountId: string;
  description: string;
  debit: number;
  credit: number;
};

export function buildPeriodCloseLines(
  rows: PeriodCloseAccountRow[],
  retainedEarningsAccountId: string,
  periodName: string,
): PeriodCloseLineDraft[] {
  const lines: PeriodCloseLineDraft[] = [];

  for (const row of rows) {
    const amount = Math.abs(row.balance);
    if (amount < 0.01) continue;

    if (row.type === "INCOME") {
      lines.push({
        accountId: row.accountId,
        description: `Close ${row.code} for ${periodName}`,
        debit: amount,
        credit: 0,
      });
      lines.push({
        accountId: retainedEarningsAccountId,
        description: `Close ${row.code} for ${periodName}`,
        debit: 0,
        credit: amount,
      });
      continue;
    }

    lines.push({
      accountId: retainedEarningsAccountId,
      description: `Close ${row.code} for ${periodName}`,
      debit: amount,
      credit: 0,
    });
    lines.push({
      accountId: row.accountId,
      description: `Close ${row.code} for ${periodName}`,
      debit: 0,
      credit: amount,
    });
  }

  return lines;
}

export function periodCloseSourceId(periodId: string) {
  return `period-close:${periodId}`;
}