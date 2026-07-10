import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildMonthlyPeriods,
  nextPeriodStatus,
  periodMonthLabel,
} from "../../apps/web/src/lib/accounting/period-policy";

describe("accounting periods helpers", () => {
  it("labels period months", () => {
    assert.equal(periodMonthLabel(new Date("2026-03-01T00:00:00.000Z")), "March 2026");
  });

  it("builds twelve monthly periods from fiscal year start", () => {
    const periods = buildMonthlyPeriods(2026, 4);
    assert.equal(periods.length, 12);
    assert.equal(periods[0]?.name, "April 2026");
    assert.equal(periods[11]?.name, "March 2027");
  });

  it("advances period status through lock and close", () => {
    assert.equal(nextPeriodStatus("OPEN", "lock"), "LOCKED");
    assert.equal(nextPeriodStatus("LOCKED", "close"), "CLOSED");
    assert.equal(nextPeriodStatus("CLOSED", "reopen"), "OPEN");
  });
});