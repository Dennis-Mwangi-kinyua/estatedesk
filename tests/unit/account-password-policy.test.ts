import assert from "node:assert/strict";
import { it } from "node:test";
import { accountPasswordSchema } from "../../apps/web/src/features/security/_lib/password-policy";
import { canAccessWorkspacePath } from "../../apps/web/src/lib/permissions/workspace-access";
import { getDeviceLabel, formatSessionDateTime } from "../../apps/web/src/features/security/_lib/helpers";
import { tenantCanAccessWorkspacePath } from "../../apps/web/src/lib/permissions/access";

it("requires a current password, a confirmed long replacement and bounded input", () => {
  const valid = { currentPassword: "existing password", newPassword: "a longer unique passphrase", confirmPassword: "a longer unique passphrase" };
  assert.equal(accountPasswordSchema.safeParse(valid).success, true);
  for (const patch of [{ currentPassword: "" }, { newPassword: "short", confirmPassword: "short" }, { confirmPassword: "something else" }, { newPassword: "x".repeat(73), confirmPassword: "x".repeat(73) }]) assert.equal(accountPasswordSchema.safeParse({ ...valid, ...patch }).success, false);
});
it("makes personal security accessible without granting organization administration", () => {
  for (const role of ["TENANT", "CARETAKER", "SECURITY", "LANDLORD", "OFFICE", "ACCOUNTANT"] as const) {
    const session = { platformRole: "USER" as const, activeOrgId: "org", activeOrgRole: role };
    assert.equal(canAccessWorkspacePath(session, "/dashboard/security"), true, role);
    assert.equal(canAccessWorkspacePath(session, "/dashboard/org/settings"), false, role);
  }
  assert.equal(canAccessWorkspacePath({ platformRole: "USER", activeOrgId: null, activeOrgRole: null }, "/dashboard/security"), true);
  assert.equal(tenantCanAccessWorkspacePath("/dashboard/security"), true);
});

it("identifies native app and tablet sessions without presenting them as desktop browsers", () => {
  assert.equal(getDeviceLabel("okhttp/4.12.0"), "App on Android");
  assert.equal(getDeviceLabel("EstateDesk/1 CFNetwork/3826 Darwin/24"), "App on Apple device");
  assert.equal(getDeviceLabel("Mozilla iPad Mobile Safari/605"), "Safari on Tablet");
  assert.equal(getDeviceLabel(null), "Unknown device");
  assert.ok(formatSessionDateTime(new Date("2026-11-10T09:00:00Z")).includes("12:00"));
});
