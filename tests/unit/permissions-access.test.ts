import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hasOrgRole,
  hasPlatformRole,
  tenantPathRequiresActiveLease,
} from "../../src/lib/permissions/access";

describe("permission access helpers", () => {
  it("checks platform role allowlists", () => {
    assert.equal(hasPlatformRole("SUPER_ADMIN", ["SUPER_ADMIN"]), true);
    assert.equal(hasPlatformRole("USER", ["PLATFORM_ADMIN", "SUPER_ADMIN"]), false);
  });

  it("checks organization role allowlists", () => {
    assert.equal(hasOrgRole("ACCOUNTANT", ["ADMIN", "ACCOUNTANT"]), true);
    assert.equal(hasOrgRole("CARETAKER", ["ADMIN", "MANAGER"]), false);
    assert.equal(hasOrgRole(null, ["ADMIN"]), false);
  });

  it("allows tenant history pages without an active lease but protects deeper tenant pages", () => {
    assert.equal(tenantPathRequiresActiveLease("/dashboard/tenant"), false);
    assert.equal(tenantPathRequiresActiveLease("/dashboard/tenant/profile"), false);
    assert.equal(tenantPathRequiresActiveLease("/dashboard/tenant/payments"), true);
    assert.equal(tenantPathRequiresActiveLease("/dashboard/org/tenants"), false);
  });
});
