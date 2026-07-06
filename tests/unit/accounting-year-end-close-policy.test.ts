import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fiscalYearRange } from "../../src/lib/accounting/year-end-close-policy";

describe("year-end close policy", () => {
  it("builds fiscal year ranges from start month", () => {
    const range = fiscalYearRange(2026, 4);
    assert.equal(range.startsAt.toISOString().slice(0, 10), "2026-04-01");
    assert.equal(range.endsAt.toISOString().slice(0, 10), "2027-03-31");
  });
});