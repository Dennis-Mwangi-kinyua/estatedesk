import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldAuditSensitivePageView } from "../../src/lib/audit/sensitive-page-audit";

describe("sensitive page audit", () => {
  it("audits detail pages and high-risk routes", () => {
    assert.equal(
      shouldAuditSensitivePageView("/dashboard/org/tenants/tenant-123"),
      true,
    );
    assert.equal(
      shouldAuditSensitivePageView("/dashboard/tenant/lease"),
      true,
    );
    assert.equal(
      shouldAuditSensitivePageView("/sign-lease/abc-token"),
      true,
    );
    assert.equal(
      shouldAuditSensitivePageView("/api-keys"),
      true,
    );
  });

  it("skips list views and non-sensitive routes", () => {
    assert.equal(shouldAuditSensitivePageView("/dashboard/org/tenants"), false);
    assert.equal(shouldAuditSensitivePageView("/dashboard/org/issues"), false);
    assert.equal(shouldAuditSensitivePageView("/vacancies"), false);
    assert.equal(shouldAuditSensitivePageView("/login"), false);
  });

  it("normalizes trailing slashes", () => {
    assert.equal(
      shouldAuditSensitivePageView("/dashboard/tenant/documents/"),
      true,
    );
    assert.equal(shouldAuditSensitivePageView("/dashboard/org/units/"), false);
  });
});