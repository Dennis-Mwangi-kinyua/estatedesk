export const OPENING_ARREARS_PREFIX = "Opening arrears · ";
export type OpeningArrearsEntry = { period: string; amount: string };

/** Twelve completed calendar months before the current Nairobi billing month. */
export function openingArrearsPeriods(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit" }).formatToParts(now);
  const year = Number(parts.find(part => part.type === "year")!.value);
  const month = Number(parts.find(part => part.type === "month")!.value);
  return Array.from({ length: 12 }, (_, offset) => new Date(Date.UTC(year, month - 2 - offset, 1)).toISOString().slice(0, 7));
}

export function parseOpeningArrears(form: FormData, options: { existingLease: boolean; unitId: string | null; leaseStartDate: Date; now?: Date }): OpeningArrearsEntry[] {
  const latestPeriod = openingArrearsPeriods(options.now)[0];
  const result: OpeningArrearsEntry[] = [];
  for (const [key, value] of form.entries()) {
    if (!key.startsWith("openingArrears:")) continue;
    const period = key.slice("openingArrears:".length);
    if (typeof value !== "string") throw new Error("Enter a valid previous balance.");
    const amount = value.trim();
    if (!amount) continue;
    if (!/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(period) || period.startsWith("0000") || period > latestPeriod) {
      throw new Error("Previous arrears must be for a completed calendar month.");
    }
    // Keep currency exact and reject negatives, exponents and excess decimals.
    if (!/^\d{1,9}(?:\.\d{1,2})?$/.test(amount)) throw new Error(`Enter a non-negative amount with up to two decimal places for ${period}.`);
    if (Number(amount) === 0) continue;
    if (!options.existingLease || !options.unitId) throw new Error("Select an existing lease and assign its unit before recording previous arrears.");
    if (period < options.leaseStartDate.toISOString().slice(0, 7)) throw new Error("Previous arrears cannot predate the lease start month.");
    if (result.some(entry => entry.period === period)) throw new Error("A previous balance month was submitted more than once.");
    result.push({ period, amount: Number(amount).toFixed(2) });
  }
  return result;
}

export function isOpeningArrearsCharge(charge: { chargeType: string; description?: string | null }) {
  return charge.chargeType === "OTHER" && !!charge.description?.startsWith(OPENING_ARREARS_PREFIX);
}
