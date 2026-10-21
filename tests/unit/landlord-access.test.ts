import assert from "node:assert/strict";
import { test } from "node:test";
import { canAccessWorkspacePath } from "../../apps/web/src/lib/permissions/workspace-access";
const admin = { platformRole: "USER" as const, activeOrgRole: "ADMIN" as const, activeOrgId: "org", membershipScope: { scopeType: "ORG", scopeId: "ORG_SCOPE" } };
test("only organization-wide administration can discover the landlord directory", () => {
  assert.equal(canAccessWorkspacePath(admin, "/dashboard/org/landlords"), true);
  assert.equal(canAccessWorkspacePath({ ...admin, activeOrgRole: "MANAGER" }, "/dashboard/org/landlords"), true);
  for (const role of ["TENANT", "CARETAKER", "OFFICE", "ACCOUNTANT", "LANDLORD"] as const) assert.equal(canAccessWorkspacePath({ ...admin, activeOrgRole: role }, "/dashboard/org/landlords"), false);
  assert.equal(canAccessWorkspacePath({ ...admin, membershipScope: { scopeType: "PROPERTY", scopeId: "property" } }, "/dashboard/org/landlords"), false);
});
