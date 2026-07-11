/**
 * AR / AP aging buckets for bookkeeping dashboards.
 * Buckets: current, 1–30, 31–60, 61–90, 90+ days past due.
 */

export type AgingBucketKey =
  | "current"
  | "d1_30"
  | "d31_60"
  | "d61_90"
  | "d90_plus";

export type AgingBucket = {
  key: AgingBucketKey;
  label: string;
  amount: number;
  count: number;
};

export type AgingItem = {
  id: string;
  party: string;
  reference: string;
  dueDate: Date | string | null;
  balance: number;
  daysPastDue: number;
  bucket: AgingBucketKey;
};

export type AgingSummary = {
  total: number;
  buckets: AgingBucket[];
  items: AgingItem[];
  overdueTotal: number;
  overdueCount: number;
};

const BUCKET_DEFS: Array<{ key: AgingBucketKey; label: string; min: number; max: number }> =
  [
    { key: "current", label: "Current", min: Number.NEGATIVE_INFINITY, max: 0 },
    { key: "d1_30", label: "1–30 days", min: 1, max: 30 },
    { key: "d31_60", label: "31–60 days", min: 31, max: 60 },
    { key: "d61_90", label: "61–90 days", min: 61, max: 90 },
    { key: "d90_plus", label: "90+ days", min: 91, max: Number.POSITIVE_INFINITY },
  ];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysPastDue(
  dueDate: Date | string | null | undefined,
  asOf: Date = new Date(),
): number {
  if (!dueDate) return 0;
  const due = dueDate instanceof Date ? dueDate : new Date(dueDate);
  if (Number.isNaN(due.getTime())) return 0;
  const ms = startOfDay(asOf).getTime() - startOfDay(due).getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export function bucketForDaysPastDue(days: number): AgingBucketKey {
  for (const def of BUCKET_DEFS) {
    if (days >= def.min && days <= def.max) return def.key;
  }
  return "d90_plus";
}

export function emptyAgingBuckets(): AgingBucket[] {
  return BUCKET_DEFS.map((def) => ({
    key: def.key,
    label: def.label,
    amount: 0,
    count: 0,
  }));
}

export function buildAgingSummary(
  rows: Array<{
    id: string;
    party: string;
    reference: string;
    dueDate: Date | string | null;
    balance: number;
  }>,
  asOf: Date = new Date(),
): AgingSummary {
  const buckets = emptyAgingBuckets();
  const bucketMap = new Map(buckets.map((b) => [b.key, b]));
  const items: AgingItem[] = [];

  for (const row of rows) {
    const balance = Number(row.balance) || 0;
    if (balance <= 0) continue;

    const dpd = daysPastDue(row.dueDate, asOf);
    const bucket = bucketForDaysPastDue(dpd);
    const bucketRow = bucketMap.get(bucket)!;
    bucketRow.amount += balance;
    bucketRow.count += 1;

    items.push({
      id: row.id,
      party: row.party,
      reference: row.reference,
      dueDate: row.dueDate,
      balance,
      daysPastDue: dpd,
      bucket,
    });
  }

  items.sort((a, b) => b.daysPastDue - a.daysPastDue || b.balance - a.balance);

  const total = buckets.reduce((s, b) => s + b.amount, 0);
  const overdueTotal = buckets
    .filter((b) => b.key !== "current")
    .reduce((s, b) => s + b.amount, 0);
  const overdueCount = buckets
    .filter((b) => b.key !== "current")
    .reduce((s, b) => s + b.count, 0);

  return {
    total,
    buckets,
    items,
    overdueTotal,
    overdueCount,
  };
}

/** Trial balance health: sum of debits should equal sum of credits. */
export function trialBalanceHealth(rows: Array<{ debit: number; credit: number }>) {
  const totalDebit = rows.reduce((s, r) => s + Number(r.debit || 0), 0);
  const totalCredit = rows.reduce((s, r) => s + Number(r.credit || 0), 0);
  const difference = Math.round((totalDebit - totalCredit) * 100) / 100;
  return {
    totalDebit,
    totalCredit,
    difference,
    balanced: Math.abs(difference) < 0.01,
  };
}

export function expenseRatio(income: number, expenses: number) {
  if (income <= 0) return expenses > 0 ? 100 : 0;
  return Math.round((expenses / income) * 1000) / 10;
}

export function netMarginPct(income: number, netIncome: number) {
  if (income <= 0) return 0;
  return Math.round((netIncome / income) * 1000) / 10;
}
