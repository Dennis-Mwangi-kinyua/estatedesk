import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hasOrgRole,
  hasPlatformRole,
  tenantPathRequiresActiveLease,
  tenantCanAccessWorkspacePath,
} from "../../apps/web/src/lib/permissions/access";

describe("permission access helpers", () => {
  it("denies tenant access to management and other tenant profile routes", () => {
    for (const path of ["/dashboard/org", "/dashboard/org/tenants", "/platform", "/properties", "/staff", "/tenants/another-tenant", "/dashboard/tenant/../../org"]) assert.equal(tenantCanAccessWorkspacePath(path), false);
    for (const path of ["/dashboard/tenant", "/dashboard/tenant/issues", "/dashboard", "/profile", "/tenants/payments", "/change-password"]) assert.equal(tenantCanAccessWorkspacePath(path), true);
  });
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
