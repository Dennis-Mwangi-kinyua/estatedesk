import assert from "node:assert/strict";
import { describe, it } from "node:test";
import ledgerUtils from "../../src/lib/ledger-utils";

const {
  addMonthsToPeriod,
  daysPastDue,
  formatLedgerCurrency,
  formatLedgerDate,
  getCurrentPeriod,
  toLedgerNumber,
} = ledgerUtils;

describe("ledger utilities", () => {
  it("normalizes decimal-like and empty values to numbers", () => {
    assert.equal(toLedgerNumber({ toNumber: () => 2500 }), 2500);
    assert.equal(toLedgerNumber(null), 0);
    assert.equal(toLedgerNumber("1250.5"), 1250.5);
  });

  it("formats Kenyan ledger currency and dates", () => {
    assert.match(formatLedgerCurrency(15000), /15,000/);
    assert.match(formatLedgerDate(new Date(2026, 5, 2)), /02/);
    assert.match(formatLedgerDate(new Date(2026, 5, 2)), /Jun/);
    assert.match(formatLedgerDate(new Date(2026, 5, 2)), /2026/);
    assert.equal(formatLedgerDate("not-a-date"), "-");
    assert.equal(formatLedgerDate(null), "-");
  });

  it("calculates periods across year boundaries", () => {
    assert.equal(getCurrentPeriod(new Date("2026-06-02T12:00:00.000Z")), "2026-06");
    assert.equal(addMonthsToPeriod("2026-12", 1), "2027-01");
    assert.equal(addMonthsToPeriod("2026-01", -1), "2025-12");
  });

  it("calculates full days past due using local day boundaries", () => {
    assert.equal(
      daysPastDue(
        new Date(2026, 5, 1),
        new Date(2026, 5, 3),
      ),
      2,
    );
    assert.equal(
      daysPastDue(
        new Date(2026, 5, 5),
        new Date(2026, 5, 3),
      ),
      -2,
    );
  });
});
