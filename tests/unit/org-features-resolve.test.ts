import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyGlobalFeatureOverrides,
  getFeatureFlag,
  parseFeatureMap,
} from "../../src/lib/org/features";

describe("org feature resolution", () => {
  it("parses org feature maps", () => {
    assert.deepEqual(parseFeatureMap({ waterBilling: true, taxes: 0 }), {
      waterBilling: true,
      taxes: false,
    });
    assert.deepEqual(parseFeatureMap(null), {});
  });

  it("applies global overrides over org settings", () => {
    const merged = applyGlobalFeatureOverrides(
      { waterBilling: true, tenantPortal: true },
      { waterBilling: false, mpesaPayments: true },
    );
    assert.equal(merged.waterBilling, false);
    assert.equal(merged.tenantPortal, true);
    assert.equal(merged.mpesaPayments, true);
  });

  it("reads feature flags with defaults", () => {
    const features = applyGlobalFeatureOverrides({}, { taxes: true });
    assert.equal(getFeatureFlag(features, "taxes"), true);
    assert.equal(getFeatureFlag(features, "missing", true), true);
    assert.equal(getFeatureFlag(features, "missing"), false);
  });
});
