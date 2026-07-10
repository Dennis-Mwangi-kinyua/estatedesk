import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getSensitivePageCategory } from "../../apps/web/src/lib/audit/sensitive-page-rules";

describe("sensitive page rules", () => {
  it("matches tenant and payment routes", () => {
    assert.equal(
      getSensitivePageCategory("/dashboard/org/tenants/tenant-123"),
      "tenant-records",
    );
    assert.equal(
      getSensitivePageCategory("/dashboard/tenant/payments/checkout"),
      "tenant-payments",
    );
    assert.equal(
      getSensitivePageCategory("/sign-lease/abc-token"),
      "lease-signing",
    );
  });

  it("ignores non-sensitive routes", () => {
    assert.equal(getSensitivePageCategory("/dashboard/org"), null);
    assert.equal(getSensitivePageCategory("/vacancies"), null);
    assert.equal(getSensitivePageCategory("/login"), null);
  });
});