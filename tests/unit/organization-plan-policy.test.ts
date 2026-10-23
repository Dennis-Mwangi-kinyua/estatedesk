import test from "node:test";
import assert from "node:assert/strict";
import { organizationPlanLimits, applyOrganizationPlanAccess, readOrganizationPlanPolicy, organizationPlanPolicySchema } from "../../apps/web/src/lib/billing/organization-plan-policy";
import { canAccessWorkspacePath } from "../../apps/web/src/lib/permissions/workspace-access";
import { rolePolicyBlocksPath } from "../../apps/web/src/lib/permissions/org-role-policy";
import { memberHasOrgPermission } from "../../apps/web/src/lib/permissions/role-matrix";

const custom = { organizationPlan: { plan: "ENTERPRISE", propertiesLimit: 7, unitsLimit: 80, usersLimit: null, allowedViews: ["properties", "tenants"] } };
test("organization-specific limits override only the matching plan and preserve defaults for other organizations", () => {
  assert.equal(organizationPlanLimits("ENTERPRISE", custom).unitsLimit, 80);
  assert.equal(organizationPlanLimits("ENTERPRISE", custom).usersLimit, Number.MAX_SAFE_INTEGER);
  assert.equal(organizationPlanLimits("PRO", custom).unitsLimit, 20);
  assert.equal(organizationPlanLimits("PRO", {}).unitsLimit, 20);
  assert.equal(organizationPlanLimits("FREE", { organizationPlan: { plan: "FREE", propertiesLimit: 0, unitsLimit: 12, usersLimit: 3 } }).unitsLimit, 12);
});
test("custom access narrows administrator grants, native routes and legacy routes without granting role permissions", () => {
  const policy = applyOrganizationPlanAccess({ permissions: { "reports.export": "allow" }, blockedViews: ["tenants"] }, "ENTERPRISE", custom)!;
  const session = { platformRole: "USER" as const, activeOrgRole: "ADMIN" as const, activeOrgId: "org", grantedPermissions: ["reports.export"], orgRolePolicy: policy };
  assert.equal(canAccessWorkspacePath(session, "/dashboard/org/properties"), true);
  for (const path of ["/dashboard/org/reports", "/reports", "/api/mobile/workspace/reports/export", "/api/mobile/tenant/payments", "/dashboard/tenant/invoice"]) {
    assert.equal(rolePolicyBlocksPath(policy, path), true, path);
  }
  assert.equal(canAccessWorkspacePath(session, "/dashboard/org/tenants"), false);
  assert.equal(memberHasOrgPermission(session, "reports.export"), false);
  assert.equal(memberHasOrgPermission({ ...session, activeOrgRole: "TENANT" }, "properties.manage"), false);
  assert.equal(applyOrganizationPlanAccess(undefined, "PRO", custom), undefined);
});
test("invalid saved policies fail closed and limits reject negative, fractional and excessive values", () => {
  assert.throws(() => readOrganizationPlanPolicy({ organizationPlan: { plan: "ENTERPRISE" } }), /invalid/);
  for (const unitsLimit of [-1, 0.5, 1_000_001]) assert.equal(organizationPlanPolicySchema.safeParse({ ...custom.organizationPlan, unitsLimit }).success, false);
  const policy = applyOrganizationPlanAccess(undefined, "ENTERPRISE", { organizationPlan: { ...custom.organizationPlan, allowedViews: [] } })!;
  assert.equal(rolePolicyBlocksPath(policy, "/dashboard/org/properties"), true);
  assert.equal(rolePolicyBlocksPath(policy, "/api/mobile/logout"), false);
});
