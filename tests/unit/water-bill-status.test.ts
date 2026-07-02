import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getWaterBillOutstandingAmount,
  isOutstandingWaterBillStatus,
  isPayableWaterBillStatus,
} from "../../src/lib/water-bills/status";

describe("water bill status helpers", () => {
  it("treats issued bills as payable and outstanding", () => {
    assert.equal(isPayableWaterBillStatus("ISSUED"), true);
    assert.equal(isOutstandingWaterBillStatus("ISSUED"), true);
    assert.equal(getWaterBillOutstandingAmount("ISSUED", 1200), 1200);
  });

  it("keeps pending approval bills visible but not payable", () => {
    assert.equal(isPayableWaterBillStatus("PENDING_APPROVAL"), false);
    assert.equal(isOutstandingWaterBillStatus("PENDING_APPROVAL"), false);
    assert.equal(getWaterBillOutstandingAmount("PENDING_APPROVAL", 1200), 0);
  });

  it("excludes cancelled and paid bills from outstanding totals", () => {
    assert.equal(getWaterBillOutstandingAmount("CANCELLED", 900), 0);
    assert.equal(getWaterBillOutstandingAmount("PAID_VERIFIED", 900), 0);
  });
});