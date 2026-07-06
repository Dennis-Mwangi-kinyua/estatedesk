import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { reconciliationVariance } from "../../src/lib/accounting/budget-policy";

describe("bank reconciliation helpers", () => {
  it("computes statement to GL variance", () => {
    assert.equal(Number(reconciliationVariance(10000, 9850)), 150);
    assert.equal(Number(reconciliationVariance(5000, 5000)), 0);
  });
});