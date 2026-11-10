/** Due date inside the billing month, clamped to that month's last day. */
export function dueDateForPeriod(period: string, dueDay: number) {
  const [yearValue, monthValue] = period.split("-").map(Number);
  const year = Number.isFinite(yearValue) ? yearValue : new Date().getFullYear();
  const month = Number.isFinite(monthValue) ? monthValue - 1 : new Date().getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(Math.max(dueDay, 1), lastDay));
}

export function isBillingPeriod(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function nairobiDateParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "01";
  return { year: read("year"), month: read("month"), day: read("day") };
}

/** Midnight at the start of the Nairobi calendar day. */
export function nairobiDayStart(now = new Date()) {
  const { year, month, day } = nairobiDateParts(now);
  return new Date(`${year}-${month}-${day}T00:00:00+03:00`);
}

/** Midnight at the start of the Nairobi calendar month. */
export function nairobiMonthStart(now = new Date()) {
  const { year, month } = nairobiDateParts(now);
  return new Date(`${year}-${month}-01T00:00:00+03:00`);
}
