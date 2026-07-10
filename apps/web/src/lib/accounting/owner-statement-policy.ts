export type OwnerStatementLineInput = {
  propertyId: string | null;
  propertyName: string;
  accountType: string;
  systemKey: string | null;
  sourceType: string;
  debit: number;
  credit: number;
};

export type OwnerStatementPropertyRow = {
  propertyId: string | null;
  propertyName: string;
  income: number;
  expenses: number;
  distributions: number;
  netToOwner: number;
};

function signedIncome(debit: number, credit: number) {
  return credit - debit;
}

function signedExpense(debit: number, credit: number) {
  return debit - credit;
}

export function aggregateOwnerStatementRows(
  lines: OwnerStatementLineInput[],
): OwnerStatementPropertyRow[] {
  const byProperty = new Map<string, OwnerStatementPropertyRow>();

  for (const line of lines) {
    const key = line.propertyId ?? "unassigned";
    const current = byProperty.get(key) ?? {
      propertyId: line.propertyId,
      propertyName: line.propertyName,
      income: 0,
      expenses: 0,
      distributions: 0,
      netToOwner: 0,
    };

    if (line.accountType === "INCOME") {
      current.income += signedIncome(line.debit, line.credit);
    } else if (line.accountType === "EXPENSE") {
      current.expenses += signedExpense(line.debit, line.credit);
    } else if (line.sourceType === "OWNER_DISTRIBUTION" && line.credit > 0) {
      current.distributions += line.credit;
    }

    byProperty.set(key, current);
  }

  return [...byProperty.values()]
    .map((row) => ({
      ...row,
      netToOwner: row.income - row.expenses - row.distributions,
    }))
    .sort((a, b) => a.propertyName.localeCompare(b.propertyName));
}

export function previousCalendarMonthRange(asOf = new Date()) {
  const month = asOf.getUTCMonth();
  const year = month === 0 ? asOf.getUTCFullYear() - 1 : asOf.getUTCFullYear();
  const monthIndex = month === 0 ? 11 : month - 1;
  const startsAt = new Date(Date.UTC(year, monthIndex, 1));
  const endsAt = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));
  return { startsAt, endsAt, label: `${startsAt.toLocaleString("en-US", { month: "long", timeZone: "UTC" })} ${year}` };
}

export function shouldSendOwnerStatementsToday(
  settings: {
    ownerStatementEmailEnabled: boolean;
    ownerStatementEmailDayOfMonth: number;
    ownerStatementLastSentAt: Date | null;
  },
  asOf = new Date(),
) {
  if (!settings.ownerStatementEmailEnabled) return false;
  if (asOf.getUTCDate() !== settings.ownerStatementEmailDayOfMonth) return false;

  const lastSent = settings.ownerStatementLastSentAt;
  if (!lastSent) return true;

  return (
    lastSent.getUTCFullYear() !== asOf.getUTCFullYear() ||
    lastSent.getUTCMonth() !== asOf.getUTCMonth()
  );
}

export function ownerStatementTotals(rows: OwnerStatementPropertyRow[]) {
  return rows.reduce(
    (totals, row) => ({
      income: totals.income + row.income,
      expenses: totals.expenses + row.expenses,
      distributions: totals.distributions + row.distributions,
      netToOwner: totals.netToOwner + row.netToOwner,
    }),
    { income: 0, expenses: 0, distributions: 0, netToOwner: 0 },
  );
}