import type { AccountingPeriodStatus } from "@prisma/client";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function periodMonthLabel(date: Date) {
  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function buildMonthlyPeriods(year: number, fiscalYearStartMonth: number) {
  const periods: Array<{ name: string; startsAt: Date; endsAt: Date }> = [];

  for (let offset = 0; offset < 12; offset += 1) {
    const monthIndex = fiscalYearStartMonth - 1 + offset;
    const yearOffset = Math.floor(monthIndex / 12);
    const month = monthIndex % 12;
    const startsAt = new Date(Date.UTC(year + yearOffset, month, 1));
    const endsAt = new Date(Date.UTC(year + yearOffset, month + 1, 0, 23, 59, 59, 999));

    periods.push({
      name: periodMonthLabel(startsAt),
      startsAt,
      endsAt,
    });
  }

  return periods;
}

export function nextPeriodStatus(
  current: AccountingPeriodStatus,
  action: "lock" | "close" | "reopen",
): AccountingPeriodStatus {
  if (action === "lock" && current === "OPEN") return "LOCKED";
  if (action === "close" && (current === "OPEN" || current === "LOCKED")) return "CLOSED";
  if (action === "reopen" && current !== "OPEN") return "OPEN";
  throw new Error(`Cannot ${action} a period that is ${current}.`);
}