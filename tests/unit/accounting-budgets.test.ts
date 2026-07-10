import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeVariance } from "../../apps/web/src/lib/accounting/budget-policy";

describe("accounting budgets helpers", () => {
  it("computes variance and percentage", () => {
    const under = computeVariance(1000, 800);
    assert.equal(under.variance, -200);
    assert.equal(under.variancePct, -20);

    const over = computeVariance(500, 650);
    assert.equal(over.variance, 150);
    assert.equal(over.variancePct, 30);
  });

  it("returns null variance percent when budget is zero", () => {
    assert.equal(computeVariance(0, 100).variancePct, null);
  });
});