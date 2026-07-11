import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  matchIndexItem,
  verifyMaintenanceQuote,
} from "../../apps/web/src/lib/vendors/price-index";

describe("local material price index", () => {
  it("matches items by description tokens", () => {
    const match = matchIndexItem({
      description: "PVC pipe 1 inch six metre",
      quantity: 2,
      unitPriceKes: 700,
    });
    assert.ok(match);
    assert.equal(match?.sku, "PIPE-PVC-1");
  });

  it("flags quotes above max fair price", () => {
    const result = verifyMaintenanceQuote([
      {
        description: "Cement 50kg bag",
        quantity: 10,
        unitPriceKes: 2000,
      },
    ]);
    assert.equal(result.overallStatus, "flag");
    assert.ok(result.flaggedLines >= 1);
  });

  it("accepts fair-band pricing", () => {
    const result = verifyMaintenanceQuote([
      {
        description: "Emulsion paint 20L bucket",
        quantity: 1,
        unitPriceKes: 4600,
      },
    ]);
    assert.equal(result.overallStatus, "ok");
  });
});
