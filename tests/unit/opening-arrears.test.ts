import assert from "node:assert/strict";
import { test } from "node:test";
import { openingArrearsPeriods, parseOpeningArrears, isOpeningArrearsCharge, OPENING_ARREARS_PREFIX } from "../../apps/web/src/lib/tenants/opening-arrears";
const now = new Date("2026-10-17T09:00:00Z");
const options = { now, existingLease: true, unitId: "unit", leaseStartDate: new Date("2025-01-01") };

test("previous balances cover exactly twelve completed Nairobi months across year boundaries", () => {
  assert.deepEqual(openingArrearsPeriods(now), ["2026-09", "2026-08", "2026-07", "2026-06", "2026-05", "2026-04", "2026-03", "2026-02", "2026-01", "2025-12", "2025-11", "2025-10"]);
  assert.equal(openingArrearsPeriods(new Date("2026-10-31T22:00:00Z"))[0], "2026-10");
});
test("imports outstanding amounts exactly, leaving settled and blank months out", () => {
  const form = new FormData();
  form.set("openingArrears:2026-09", "1250.25"); form.set("openingArrears:2026-08", "0"); form.set("openingArrears:2026-07", "");
  assert.deepEqual(parseOpeningArrears(form, options), [{ period: "2026-09", amount: "1250.25" }]);
});
test("rejects unsupported amounts, months, duplicate months and balances without a mapped existing lease", () => {
  for (const [period, amount] of [["2026-10", "100"], ["2026-13", "100"], ["2026-00", "100"], ["0000-01", "100"], ["2025-9", "100"], ["2026-09", "-1"], ["2026-09", "1.001"], ["2026-09", "1e3"], ["2026-09", "Infinity"]]) {
    const form = new FormData(); form.set(`openingArrears:${period}`, amount);
    assert.throws(() => parseOpeningArrears(form, options));
  }
  const form = new FormData(); form.set("openingArrears:2026-09", "100");
  assert.throws(() => parseOpeningArrears(form, { ...options, unitId: null }));
  assert.throws(() => parseOpeningArrears(form, { ...options, existingLease: false }));
  assert.throws(() => parseOpeningArrears(form, { ...options, leaseStartDate: new Date("2026-10-01") }));
  form.append("openingArrears:2026-09", "200");
  assert.throws(() => parseOpeningArrears(form, options));
});
test("opening balance detection does not suppress normal rent or garbage charges", () => {
  assert.equal(isOpeningArrearsCharge({ chargeType: "OTHER", description: `${OPENING_ARREARS_PREFIX}2026-09` }), true);
  assert.equal(isOpeningArrearsCharge({ chargeType: "OTHER", description: "Monthly garbage fee" }), false);
  assert.equal(isOpeningArrearsCharge({ chargeType: "RENT", description: `${OPENING_ARREARS_PREFIX}2026-09` }), false);
});

test("accepts balances from any completed past year within the lease", () => {
  const form = new FormData();
  form.set("openingArrears:1998-01", "123.45");
  form.set("openingArrears:2009-12", "700");
  form.set("openingArrears:2025-09", "900.5");
  assert.deepEqual(parseOpeningArrears(form, { ...options, leaseStartDate: new Date("1998-01-01") }), [
    { period: "1998-01", amount: "123.45" },
    { period: "2009-12", amount: "700.00" },
    { period: "2025-09", amount: "900.50" },
  ]);
  assert.throws(() => parseOpeningArrears(form, options), /cannot predate/);
});

test("can import every month across multiple decades without a year limit", () => {
  const form = new FormData();
  for (let year = 1990; year < 2026; year++) {
    for (let month = 1; month <= 12; month++) form.set(`openingArrears:${year}-${String(month).padStart(2, "0")}`, "1.25");
  }
  const entries = parseOpeningArrears(form, { ...options, leaseStartDate: new Date("1990-01-01") });
  assert.equal(entries.length, 36 * 12);
  assert.equal(entries.reduce((sum, entry) => sum + Math.round(Number(entry.amount) * 100), 0), 54000);
});
