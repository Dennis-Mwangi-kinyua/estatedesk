import assert from "node:assert/strict";
import { test } from "node:test";
import { memberHasOrgPermission } from "../../apps/web/src/lib/permissions/role-matrix";
import { readOrgRolePolicies, rolePolicyBlocksPath, orgRolePolicySchema, ORGANIZATION_ROLES } from "../../apps/web/src/lib/permissions/org-role-policy";
import { canAccessWorkspacePath, canDiscoverWorkspaceHref } from "../../apps/web/src/lib/permissions/workspace-access";

test("tenant aliases and caretaker navigation retain organization view restrictions", () => {
  const orgRolePolicy = orgRolePolicySchema.parse({ blockedViews: ["leases", "move-outs", "rewards", "issues"] });
  const tenant = { activeOrgRole: "TENANT" as const, activeOrgId: "org", platformRole: "USER" as const, orgRolePolicy };
  for (const path of ["/dashboard/tenant/lease", "/dashboard/tenant/history", "/dashboard/tenant/notices", "/dashboard/tenant/rewards"]) {
    assert.equal(canDiscoverWorkspaceHref(tenant, path), false, path);
    assert.equal(canAccessWorkspacePath(tenant, path), false, path);
  }
  const caretaker = { ...tenant, activeOrgRole: "CARETAKER" as const, caretakerSections: ["", "issues", "profile"] };
  assert.equal(canDiscoverWorkspaceHref(caretaker, "/dashboard/caretaker/issues"), false);
  assert.equal(canDiscoverWorkspaceHref(caretaker, "/dashboard/caretaker/inspections"), false);
  assert.equal(canDiscoverWorkspaceHref(caretaker, "/dashboard/caretaker/profile"), true);
  assert.equal(canDiscoverWorkspaceHref(caretaker, "/dashboard/caretaker"), true);
});

test("role denies override administrator defaults and individually delegated mandates", () => {
  const orgRolePolicy = orgRolePolicySchema.parse({ permissions: { "payments.verify": "deny" } });
  for (const activeOrgRole of ["ADMIN", "MANAGER", "ACCOUNTANT"] as const) {
    assert.equal(memberHasOrgPermission({ activeOrgRole, grantedPermissions: ["payments.verify"], orgRolePolicy }, "payments.verify"), false);
  }
  assert.equal(memberHasOrgPermission({ activeOrgRole: "ADMIN" }, "payments.verify"), true);
});
test("explicit role grants apply only to supported permission checks", () => {
  const orgRolePolicy = orgRolePolicySchema.parse({ permissions: { "org.settings.manage": "allow" } });
  assert.equal(memberHasOrgPermission({ activeOrgRole: "MANAGER", orgRolePolicy }, "org.settings.manage"), true);
  assert.equal(memberHasOrgPermission({ activeOrgRole: "MANAGER" }, "org.settings.manage"), false);
  assert.equal(canAccessWorkspacePath({ activeOrgRole: "TENANT", activeOrgId: "org", platformRole: "USER", orgRolePolicy }, "/dashboard/org/settings"), false);
});
test("blocked views apply to navigation, direct paths, legacy paths and scoped APIs", () => {
  const orgRolePolicy = orgRolePolicySchema.parse({ blockedViews: ["payments", "agreements", "bills", "properties"] });
  for (const path of ["/dashboard/org/payments", "/payments/example", "/api/service-agreements/example", "/agreements/verify/example", "/api/mobile/tenant/bills", "/dashboard/tenant/invoice", "/dashboard/org/units"]) {
    assert.equal(rolePolicyBlocksPath(orgRolePolicy, path), true, path);
  }
  for (const activeOrgRole of ORGANIZATION_ROLES) {
    const session = { activeOrgRole, activeOrgId: "org", platformRole: "USER" as const, orgRolePolicy };
    assert.equal(canAccessWorkspacePath(session, "/dashboard/org/payments"), false);
    assert.equal(canDiscoverWorkspaceHref(session, "/dashboard/org/payments"), false);
    assert.equal(canAccessWorkspacePath(session, "/access-denied"), true);
  }
});

test("native notification and nested workflow routes respect the same section restrictions", () => {
  const policy = orgRolePolicySchema.parse({ blockedViews: ["notifications", "payments", "meters", "issues"] });
  for (const path of ["/api/mobile/notifications", "/api/mobile/tenant/payments/history", "/api/mobile/caretaker/meters", "/api/mobile/tenant/issues"]) assert.equal(rolePolicyBlocksPath(policy, path), true, path);
  assert.equal(rolePolicyBlocksPath(policy, "/api/mobile/memberships"), false);
});
test("policies are scoped to the supplied organization and reject corrupt or unknown rights", () => {
  const policies = readOrgRolePolicies({ MANAGER: { permissions: { "payments.verify": "deny" }, blockedViews: [] } });
  assert.equal(policies.ADMIN, undefined);
  assert.deepEqual(readOrgRolePolicies(null), {});
  assert.throws(() => readOrgRolePolicies({ MANAGER: { permissions: { "platform.admin": "allow" } } }));
  assert.throws(() => readOrgRolePolicies({ UNKNOWN: { blockedViews: [] } }));
});
