const DAY_MS = 24 * 60 * 60 * 1000;

export function toLedgerNumber(value: unknown): number {
  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return Number(value ?? 0);
}

export function formatLedgerCurrency(value: unknown) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(toLedgerNumber(value));
}

export function formatLedgerDate(value: Date | string | null | undefined) {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export function getCurrentPeriod(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function addMonthsToPeriod(period: string, offset: number) {
  const [yearValue, monthValue] = period.split("-").map(Number);
  const start = new Date(
    Number.isFinite(yearValue) ? yearValue : new Date().getFullYear(),
    Number.isFinite(monthValue) ? monthValue - 1 : new Date().getMonth(),
    1,
  );
  start.setMonth(start.getMonth() + offset);

  return getCurrentPeriod(start);
}

export function daysPastDue(dueDate: Date, now = new Date()) {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  return Math.floor((startOfToday.getTime() - due.getTime()) / DAY_MS);
}

const ledgerUtils = {
  addMonthsToPeriod,
  daysPastDue,
  formatLedgerCurrency,
  formatLedgerDate,
  getCurrentPeriod,
  toLedgerNumber,
};

export default ledgerUtils;
