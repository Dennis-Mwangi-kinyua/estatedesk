import assert from "node:assert/strict";
import { test } from "node:test";
import { memberHasOrgPermission, validateOrgMandates } from "../../apps/web/src/lib/permissions/role-matrix";
import { canAccessWorkspacePath, canDiscoverWorkspaceHref } from "../../apps/web/src/lib/permissions/workspace-access";
test("staff mandates add specific powers without granting admin status", () => {
  for (const activeOrgRole of ["OFFICE", "MANAGER", "ACCOUNTANT"] as const) {
    const member = { activeOrgRole, grantedPermissions: ["move-outs.arrears.approve"] };
    assert.equal(memberHasOrgPermission(member, "move-outs.arrears.approve"), true);
    assert.equal(memberHasOrgPermission({ ...member, grantedPermissions: [] }, "move-outs.arrears.approve"), false);
    assert.equal(memberHasOrgPermission(member, "org.users.manage"), false);
  }
  assert.equal(memberHasOrgPermission({ activeOrgRole: "ADMIN" }, "move-outs.arrears.approve"), true);
  for (const activeOrgRole of ["TENANT", "LANDLORD", "CARETAKER", null] as const) assert.equal(memberHasOrgPermission({ activeOrgRole, grantedPermissions: ["move-outs.arrears.approve"] }, "move-outs.arrears.approve"), false);
});
test("only registered mandates can be assigned and revoked mandates stop authorising", () => {
  assert.deepEqual(validateOrgMandates(["payments.verify", "payments.verify", "org.users.manage"]), ["payments.verify", "org.users.manage"]);
  for (const value of ["ADMIN", "*", "platform.control", "caretaker.fieldwork", 1]) assert.throws(() => validateOrgMandates([value]));
  assert.equal(memberHasOrgPermission({ activeOrgRole: "OFFICE", grantedPermissions: ["payments.verify"] }, "payments.verify"), true);
  assert.equal(memberHasOrgPermission({ activeOrgRole: "OFFICE", grantedPermissions: [] }, "payments.verify"), false);
});
test("office staff can hand over debt-free tenancies and discover only their delegated desks", () => {
  const office = { platformRole: "USER" as const, activeOrgRole: "OFFICE" as const, activeOrgId: "org", grantedPermissions: [] as string[] };
  assert.equal(canAccessWorkspacePath(office, "/dashboard/org/move-outs/notice"), true);
  assert.equal(canAccessWorkspacePath({ ...office, activeOrgRole: "ACCOUNTANT" }, "/dashboard/org/move-outs/notice"), true);
  assert.equal(canAccessWorkspacePath(office, "/dashboard/org/accounting/requests"), false);
  assert.equal(canAccessWorkspacePath({ ...office, grantedPermissions: ["org.users.manage"] }, "/dashboard/org/staff/permissions"), false);
  const reviewer = { ...office, grantedPermissions: ["finance.requests.review"] };
  assert.equal(canAccessWorkspacePath(reviewer, "/dashboard/org/accounting/requests"), true);
  assert.equal(canDiscoverWorkspaceHref(reviewer, "/dashboard/org/accounting/requests"), true);
  assert.equal(canAccessWorkspacePath(reviewer, "/dashboard/org/accounting/journals"), false);
  assert.equal(canAccessWorkspacePath(reviewer, "/dashboard/org/settings"), false);
  assert.equal(canAccessWorkspacePath({ ...office, grantedPermissions: ["org.settings.manage"] }, "/dashboard/org/settings"), true);
  assert.equal(canAccessWorkspacePath({ ...office, activeOrgId: null, grantedPermissions: ["org.settings.manage"] }, "/dashboard/org/settings"), false);
  assert.equal(canAccessWorkspacePath({ ...office, activeOrgRole: "TENANT", grantedPermissions: ["org.settings.manage"] }, "/dashboard/org/settings"), false);
});
