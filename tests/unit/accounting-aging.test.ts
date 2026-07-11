import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bucketForDaysPastDue,
  buildAgingSummary,
  daysPastDue,
  expenseRatio,
  netMarginPct,
  trialBalanceHealth,
} from "../../apps/web/src/lib/accounting/aging";

describe("accounting aging & bookkeeping helpers", () => {
  it("classifies days past due into buckets", () => {
    assert.equal(bucketForDaysPastDue(0), "current");
    assert.equal(bucketForDaysPastDue(-3), "current");
    assert.equal(bucketForDaysPastDue(15), "d1_30");
    assert.equal(bucketForDaysPastDue(45), "d31_60");
    assert.equal(bucketForDaysPastDue(75), "d61_90");
    assert.equal(bucketForDaysPastDue(120), "d90_plus");
  });

  it("builds AR/AP aging totals", () => {
    const asOf = new Date(2026, 6, 12);
    const summary = buildAgingSummary(
      [
        {
          id: "1",
          party: "Jane",
          reference: "Rent",
          dueDate: new Date(2026, 6, 1),
          balance: 10000,
        },
        {
          id: "2",
          party: "Vendor Co",
          reference: "BILL-1",
          dueDate: new Date(2026, 5, 1),
          balance: 5000,
        },
        {
          id: "3",
          party: "Current",
          reference: "Future",
          dueDate: new Date(2026, 6, 20),
          balance: 2000,
        },
      ],
      asOf,
    );

    assert.equal(summary.total, 17000);
    assert.ok(summary.overdueTotal >= 15000);
    assert.equal(summary.buckets.find((b) => b.key === "current")?.count, 1);
  });

  it("detects trial balance imbalance", () => {
    const ok = trialBalanceHealth([
      { debit: 100, credit: 0 },
      { debit: 0, credit: 100 },
    ]);
    assert.equal(ok.balanced, true);

    const bad = trialBalanceHealth([
      { debit: 100, credit: 0 },
      { debit: 0, credit: 90 },
    ]);
    assert.equal(bad.balanced, false);
    assert.equal(bad.difference, 10);
  });

  it("computes expense ratio and margin", () => {
    assert.equal(expenseRatio(100000, 40000), 40);
    assert.equal(netMarginPct(100000, 25000), 25);
  });

  it("computes days past due on calendar boundaries", () => {
    assert.equal(
      daysPastDue(new Date(2026, 6, 10), new Date(2026, 6, 12)),
      2,
    );
  });
});
