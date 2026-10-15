import assert from "node:assert/strict";
import { test } from "node:test";
import { getRedirectAfterLogin, ROLE_HOME_PATHS } from "../../apps/web/src/lib/auth/redirect-after-login";
import { canAccessWorkspacePath } from "../../apps/web/src/lib/permissions/workspace-access";
import { activeNavigationHref, groupNavigation, WORKSPACE_NAVIGATION } from "../../apps/web/src/lib/navigation/workspace-navigation";
import { getNavItemsForMode } from "../../apps/web/src/app/(app)/platform/_lib/nav";

const base = { platformRole: "USER" as const, activeOrgId: "org", hasTenantProfile: false };

test("every role opens an authorized work area, even with a historical tenant profile", () => {
  const expected = { ADMIN: "/dashboard/org", MANAGER: "/dashboard/org", OFFICE: "/dashboard/org/tenants", ACCOUNTANT: "/dashboard/org/accounting", CARETAKER: "/dashboard/caretaker/today", TENANT: "/dashboard/tenant", LANDLORD: "/dashboard/landlord", SECURITY: "/dashboard/gate" };
  for (const role of Object.keys(ROLE_HOME_PATHS) as (keyof typeof ROLE_HOME_PATHS)[]) {
    const account = { ...base, activeOrgRole: role, hasTenantProfile: true };
    assert.equal(getRedirectAfterLogin(account), expected[role]);
    assert.equal(canAccessWorkspacePath(account, getRedirectAfterLogin(account)), true);
    assert.equal(getRedirectAfterLogin({ ...account, activeOrgId: null }), "/login?error=missing_org_context");
  }
});

test("platform preference and profile-only account fallbacks remain deterministic", () => {
  for (const platformRole of ["SUPER_ADMIN", "PLATFORM_ADMIN"] as const) {
    assert.equal(getRedirectAfterLogin({ ...base, platformRole, activeOrgRole: null }), "/platform");
    assert.equal(getRedirectAfterLogin({ ...base, platformRole, activeOrgRole: null, preferredPlatformMode: "developer" }), "/platform/developer");
  }
  assert.equal(getRedirectAfterLogin({ ...base, activeOrgRole: null, activeOrgId: null, hasTenantProfile: true }), "/dashboard/tenant");
  assert.equal(getRedirectAfterLogin({ ...base, activeOrgRole: null, activeOrgId: null, hasServiceProvider: true }), "/provider");
  assert.equal(getRedirectAfterLogin({ ...base, activeOrgRole: null }), "/login?error=no_active_role");
});

test("navigation groups preserve every permitted platform route without empty or duplicate sections", () => {
  for (const mode of ["admin", "developer"] as const) {
    for (const isSuperAdmin of [true, false]) {
      const items = getNavItemsForMode(mode, { isSuperAdmin });
      const groups = groupNavigation(items, WORKSPACE_NAVIGATION[`platform-${mode}`]);
      const destinations = groups.flatMap(group => group.items.map(item => item.href));
      assert.deepEqual([...destinations].sort(), items.map(item => item.href).sort());
      assert.equal(new Set(destinations).size, destinations.length);
      assert.equal(groups.some(group => !group.items.length || group.label === "More tools"), false);
      assert.equal(destinations.includes("/platform/control"), mode === "developer" && isSuperAdmin);
    }
  }
  assert.deepEqual(groupNavigation([], WORKSPACE_NAVIGATION.org), []);
  assert.deepEqual(groupNavigation([{ href: "/new-tool" }], WORKSPACE_NAVIGATION.org), [{ label: "More tools", items: [{ href: "/new-tool" }] }]);
});

test("nested and hash destinations have exactly one current link", () => {
  const org = ["/dashboard/org", "/dashboard/org/accounting", "/dashboard/org/accounting/requests"].map(href => ({ href }));
  assert.equal(activeNavigationHref("/dashboard/org/accounting/requests/123", org), "/dashboard/org/accounting/requests");
  assert.equal(activeNavigationHref("/dashboard/org/tenants", org), null);
  const landlord = ["/dashboard/landlord", "/dashboard/landlord#properties", "/dashboard/landlord/statements"].map(href => ({ href }));
  assert.equal(activeNavigationHref("/dashboard/landlord", landlord, "#properties"), "/dashboard/landlord#properties");
  assert.equal(activeNavigationHref("/dashboard/landlord/statements", landlord), "/dashboard/landlord/statements");
  assert.equal(activeNavigationHref("/dashboard/org/accountingish", org), null);
});
