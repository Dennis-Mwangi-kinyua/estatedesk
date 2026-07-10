import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  forcedModeForPath,
  getModeHome,
  getNavItemsForMode,
  isDeveloperExclusivePath,
  isDualModePath,
  isNavItemActive,
  isSuperAdminOnlyPath,
  resolvePlatformMode,
} from "../../apps/web/src/app/(app)/platform/_lib/nav";

describe("platform nav mode", () => {
  it("resolves admin mode for administration routes", () => {
    assert.equal(resolvePlatformMode("/platform"), "admin");
    assert.equal(resolvePlatformMode("/platform/organizations"), "admin");
    assert.equal(resolvePlatformMode("/platform/users/abc"), "admin");
    assert.equal(resolvePlatformMode("/platform/settings"), "admin");
    assert.equal(isDeveloperExclusivePath("/platform"), false);
  });

  it("resolves developer mode for exclusive developer routes", () => {
    assert.equal(resolvePlatformMode("/platform/developer"), "developer");
    assert.equal(resolvePlatformMode("/platform/api-keys"), "developer");
    assert.equal(resolvePlatformMode("/platform/jobs"), "developer");
    assert.equal(resolvePlatformMode("/platform/system-health"), "developer");
    assert.equal(resolvePlatformMode("/platform/feature-flags"), "developer");
    assert.equal(resolvePlatformMode("/platform/rate-limits"), "developer");
    assert.equal(resolvePlatformMode("/platform/data-management"), "developer");
    assert.equal(resolvePlatformMode("/platform/backups"), "developer");
    assert.equal(resolvePlatformMode("/platform/api-explorer"), "developer");
    assert.equal(resolvePlatformMode("/platform/control"), "developer");
    assert.equal(isDeveloperExclusivePath("/platform/developer/docs"), true);
    assert.equal(isSuperAdminOnlyPath("/platform/control"), true);
  });

  it("keeps dual-mode routes sticky to preferred mode", () => {
    assert.equal(isDualModePath("/platform/help"), true);
    assert.equal(isDualModePath("/platform/security"), true);
    assert.equal(isDualModePath("/platform/audit-logs"), true);
    assert.equal(forcedModeForPath("/platform/help"), null);
    assert.equal(resolvePlatformMode("/platform/help", "admin"), "admin");
    assert.equal(resolvePlatformMode("/platform/help", "developer"), "developer");
    assert.equal(resolvePlatformMode("/platform/audit-logs", "developer"), "developer");
    assert.equal(resolvePlatformMode("/platform/security", "admin"), "admin");
  });

  it("returns distinct nav sets and filters super-admin-only tools", () => {
    const admin = getNavItemsForMode("admin");
    const developer = getNavItemsForMode("developer", { isSuperAdmin: true });
    const developerPlatformAdmin = getNavItemsForMode("developer", {
      isSuperAdmin: false,
    });

    assert.ok(admin.some((item) => item.href === "/platform"));
    assert.ok(admin.some((item) => item.href === "/platform/organizations"));
    assert.ok(admin.some((item) => item.href === "/platform/help"));
    assert.ok(admin.some((item) => item.href === "/platform/audit-logs"));
    assert.ok(!admin.some((item) => item.href === "/platform/api-keys"));

    assert.ok(developer.some((item) => item.href === "/platform/developer"));
    assert.ok(developer.some((item) => item.href === "/platform/api-keys"));
    assert.ok(developer.some((item) => item.href === "/platform/api-explorer"));
    assert.ok(!developer.some((item) => item.href === "/platform/organizations"));

    assert.ok(
      !developerPlatformAdmin.some((item) => item.href === "/platform/api-keys"),
    );
    assert.ok(!developerPlatformAdmin.some((item) => item.href === "/platform/jobs"));
    assert.ok(
      !developerPlatformAdmin.some((item) => item.href === "/platform/data-management"),
    );
    assert.ok(
      !developerPlatformAdmin.some((item) => item.href === "/platform/backups"),
    );
    assert.ok(
      developerPlatformAdmin.some((item) => item.href === "/platform/feature-flags"),
    );
  });

  it("maps mode homes and super-admin paths correctly", () => {
    assert.equal(getModeHome("admin"), "/platform");
    assert.equal(getModeHome("developer"), "/platform/developer");
    assert.equal(isSuperAdminOnlyPath("/platform/api-keys"), true);
    assert.equal(isSuperAdminOnlyPath("/platform/jobs/retry"), true);
    assert.equal(isSuperAdminOnlyPath("/platform/feature-flags"), false);
  });

  it("marks nav items active without false positives", () => {
    assert.equal(isNavItemActive("/platform", "/platform"), true);
    assert.equal(isNavItemActive("/platform/organizations", "/platform"), false);
    assert.equal(isNavItemActive("/platform/developer", "/platform/developer"), true);
    assert.equal(isNavItemActive("/platform/api-keys", "/platform/api-keys"), true);
    assert.equal(isNavItemActive("/platform/users/123", "/platform/users"), true);
  });
});
