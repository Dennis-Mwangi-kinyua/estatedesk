import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getModeHome, getNavItemsForMode, getPlatformNavItems, platformNavItems, isSuperAdminOnlyPath, isNavItemActive } from "../../apps/web/src/app/(app)/platform/_lib/nav";
import { PLATFORM_NAVIGATION, groupNavigation } from "../../apps/web/src/lib/navigation/workspace-navigation";

describe("unified platform navigation", () => {
  it("exposes business and technical tools together without duplicate destinations", () => {
    const items = getPlatformNavItems({ isSuperAdmin: true });
    assert.equal(new Set(items.map(item => item.href)).size, items.length);
    for (const href of ["/platform", "/platform/demos", "/platform/organizations", "/platform/payments", "/platform/system-health", "/platform/jobs", "/platform/developer/docs"]) {
      assert.ok(items.some(item => item.href === href), href);
    }
    assert.ok(!items.some(item => item.href === "/platform/developer"));
    assert.deepEqual(getNavItemsForMode("admin"), getNavItemsForMode("developer"));
    assert.equal(getModeHome("developer"), "/platform");
  });
  it("keeps restricted controls exclusive to super admins", () => {
    assert.ok(!getPlatformNavItems({ isSuperAdmin: false }).some(item => item.superAdminOnly));
    assert.ok(getPlatformNavItems({ isSuperAdmin: true }).some(item => item.href === "/platform/control"));
    assert.ok(!getNavItemsForMode("developer").some(item => item.superAdminOnly));
    assert.equal(isSuperAdminOnlyPath("/platform/control"), true);
    assert.equal(isSuperAdminOnlyPath("/platform/api-keys"), false);
  });
  it("curates every route into exactly one group", () => {
    const groups = groupNavigation(platformNavItems, PLATFORM_NAVIGATION);
    assert.ok(!groups.some(group => group.label === "More tools"));
    assert.equal(groups.flatMap(group => group.items).length, platformNavItems.length);
  });
  it("keeps the home inactive on nested tool pages", () => {
    assert.equal(isNavItemActive("/platform/jobs", "/platform"), false);
    assert.equal(isNavItemActive("/platform/jobs/notifications", "/platform/jobs"), true);
  });
});
