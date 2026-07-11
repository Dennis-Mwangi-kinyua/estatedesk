import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildEtimsReadyReceiptFields,
  formatEtimsFooterSummary,
} from "../../apps/web/src/lib/tax/etims-receipt";

describe("eTIMS-ready receipt fields", () => {
  it("builds zero-rated item lines from allocations", () => {
    const fields = buildEtimsReadyReceiptFields({
      serialNumber: "RCP-001",
      organizationKraPin: "P051234567X",
      amount: 25000,
      allocations: [
        { period: "2026-07", description: "Service charge", amount: 2000 },
        { period: "2026-07", description: "Rent", amount: 23000 },
      ],
      controlUnitSerial: "KRA-CU-TEST-01",
    });
    assert.equal(fields.itemLines.length, 2);
    assert.equal(fields.totalAmount, 25000);
    assert.equal(fields.taxAmount, 0);
    assert.equal(fields.sellerPin, "P051234567X");
  });

  it("formats footer summary", () => {
    const fields = buildEtimsReadyReceiptFields({
      serialNumber: "RCP-002",
      amount: 1000,
    });
    const footer = formatEtimsFooterSummary(fields);
    assert.match(footer, /eTIMS/);
  });
});
