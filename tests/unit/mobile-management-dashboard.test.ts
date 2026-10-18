import test from "node:test";
import assert from "node:assert/strict";
import type { AppSession } from "../../apps/web/src/lib/auth/session";
import { mobileWorkspaceAllowed, mobileWorkspaceEntry, mobileWorkspaceLinks } from "../../apps/web/src/lib/mobile/workspace-menu";
import { mobileSessionSchema } from "../../packages/contracts/src/mobile";

const session = (role: AppSession["activeOrgRole"], platformRole: AppSession["platformRole"] = "USER"): AppSession => ({
  userId: "user", fullName: "Fictional User", email: null, activeOrgRole: role, activeOrgId: role ? "org" : null,
  platformRole, membershipScope: null, mustChangePassword: false, requiresTermsAcceptance: false,
});
test("tenant, field and unaffiliated accounts cannot discover management or platform menus", () => {
  for (const role of [null, "TENANT", "CARETAKER", "SECURITY"] as const) {
    assert.equal(mobileWorkspaceAllowed(session(role), "organization"), false);
    assert.deepEqual(mobileWorkspaceLinks(session(role), "organization"), []);
    assert.equal(mobileWorkspaceAllowed(session(role), "platform"), false);
    assert.deepEqual(mobileWorkspaceLinks(session(role), "platform"), []);
  }
});
test("organization menus use web role policies, blocked views and explicit grants", () => {
  const accountant = session("ACCOUNTANT");
  assert.ok(mobileWorkspaceLinks(accountant, "organization").some(link => link.path === "/dashboard/org/accounting"));
  assert.ok(!mobileWorkspaceLinks(accountant, "organization").some(link => link.path === "/dashboard/org/units"));
  accountant.grantedPermissions = ["properties.manage"];
  assert.ok(mobileWorkspaceLinks(accountant, "organization").some(link => link.path === "/dashboard/org/units"));
  accountant.orgRolePolicy = { blockedViews: ["properties"], permissions: {} };
  assert.ok(!mobileWorkspaceLinks(accountant, "organization").some(link => link.path === "/dashboard/org/units"));
  const office = mobileWorkspaceLinks(session("OFFICE"), "organization");
  assert.ok(!office.some(link => link.path === "/dashboard/org/settings"));
  assert.ok(office.some(link => link.path === "/dashboard/org/tenants"));
});
test("platform menus preserve super-admin controls and keep dual memberships separate", () => {
  const admin = mobileWorkspaceLinks(session(null, "PLATFORM_ADMIN"), "platform");
  assert.ok(admin.some(link => link.path === "/platform/organizations"));
  assert.ok(!admin.some(link => link.path === "/platform/control"));
  const root = mobileWorkspaceLinks(session("TENANT", "SUPER_ADMIN"), "platform");
  assert.ok(root.some(link => link.path === "/platform/control"));
  assert.deepEqual(mobileWorkspaceLinks(session("TENANT", "SUPER_ADMIN"), "organization"), []);
  assert.equal(new Set(root.map(link => link.path)).size, root.length);
  assert.ok(root.every(link => link.emoji && link.description && link.group));
});
test("bootstrap entry points are exact authorized destinations, never client-supplied redirects", () => {
  const links = mobileWorkspaceLinks(session(null, "PLATFORM_ADMIN"), "platform");
  assert.equal(mobileWorkspaceEntry(links, "/platform/users", "platform"), "/platform/users");
  for (const path of ["/platform/control", "https://attacker.test", "//attacker.test", '/platform/\"><script>', "/dashboard/org/settings"]) assert.equal(mobileWorkspaceEntry(links, path, "platform"), "/platform");
  assert.equal(mobileWorkspaceEntry([], "/platform", "platform"), null);
});
test("older session payloads cannot implicitly advertise a platform role", () => {
  const parsed = mobileSessionSchema.parse({ fullName: "Tenant", role: "TENANT", organizationName: "Example", requiresAccountSetup: false });
  assert.equal(parsed.platformRole, "USER");
});
