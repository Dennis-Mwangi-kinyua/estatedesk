import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { usesAccrualRecognition } from "../../src/lib/accounting/policy";

describe("accounting settings", () => {
  it("detects accrual recognition mode", () => {
    assert.equal(usesAccrualRecognition({ recognitionMode: "ACCRUAL" }), true);
    assert.equal(usesAccrualRecognition({ recognitionMode: "CASH" }), false);
  });
});