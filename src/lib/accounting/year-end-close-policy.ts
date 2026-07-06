export type FiscalYearRange = {
  year: number;
  startsAt: Date;
  endsAt: Date;
};

export function fiscalYearRange(year: number, fiscalYearStartMonth: number): FiscalYearRange {
  const startMonthIndex = fiscalYearStartMonth - 1;
  const startsAt = new Date(Date.UTC(year, startMonthIndex, 1));
  const endMonthIndex = (startMonthIndex + 11) % 12;
  const endYear = startMonthIndex + 11 >= 12 ? year + 1 : year;
  const endsAt = new Date(Date.UTC(endYear, endMonthIndex + 1, 0, 23, 59, 59, 999));

  return { year, startsAt, endsAt };
}

export function periodWithinFiscalYear(
  period: { startsAt: Date; endsAt: Date },
  range: FiscalYearRange,
) {
  return period.startsAt >= range.startsAt && period.endsAt <= range.endsAt;
}

export function summarizeYearEndResult(result: {
  locked: number;
  closingPosted: number;
  closed: number;
  skipped: number;
}) {
  return `Year-end close complete: ${result.locked} locked, ${result.closingPosted} closing entries, ${result.closed} closed, ${result.skipped} skipped (no activity).`;
}