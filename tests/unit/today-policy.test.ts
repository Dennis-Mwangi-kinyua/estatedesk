import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { todayBounds, todayUrgency, billUrgency } from "../../apps/web/src/features/today/policy";
import { canAccessWorkspacePath } from "../../apps/web/src/lib/permissions/workspace-access";
import { tenantCanAccessWorkspacePath } from "../../apps/web/src/lib/permissions/access";

describe("personal Today", () => {
  it("uses Nairobi day boundaries across UTC midnight", () => {
    const now = new Date("2026-11-09T22:15:00Z");
    assert.equal(todayBounds(now).start.toISOString(), "2026-11-09T21:00:00.000Z");
    assert.equal(todayBounds(now).end.toISOString(), "2026-11-10T21:00:00.000Z");
    assert.equal(todayUrgency(new Date("2026-11-10T20:59:59Z"), now), "today");
    assert.equal(todayUrgency(new Date("2026-11-10T21:00:00Z"), now), "normal");
    assert.equal(todayUrgency(new Date("2026-11-09T22:14:59Z"), now), "overdue");
    assert.equal(todayUrgency(null, now), "normal");
  });
  it("does not call a calendar-date bill overdue during its due day", () => {
    const now = new Date("2026-11-10T09:00:00Z");
    assert.equal(billUrgency(new Date("2026-11-10T00:00:00Z"), now), "today");
    assert.equal(billUrgency(new Date("2026-11-09T00:00:00Z"), now), "overdue");
    assert.equal(billUrgency(new Date("2026-11-11T00:00:00Z"), now), "normal");
  });
  it("allows a personal Today page without granting access to other role workspaces", () => {
    for (const role of ["TENANT", "SECURITY", "LANDLORD", "CARETAKER", "OFFICE", "MANAGER", "ACCOUNTANT", "ADMIN"] as const) {
      const session = { platformRole: "USER" as const, activeOrgId: "org", activeOrgRole: role, membershipScope: { scopeType: "UNIT", scopeId: "own-unit" } };
      assert.equal(canAccessWorkspacePath(session, "/dashboard/today"), true, role);
      if (role !== "ADMIN") assert.equal(canAccessWorkspacePath(session, "/dashboard/org/settings"), false, role);
    }
    assert.equal(tenantCanAccessWorkspacePath("/dashboard/today"), true);
    assert.equal(tenantCanAccessWorkspacePath("/dashboard/today/other-user"), false);
    assert.equal(canAccessWorkspacePath({ platformRole: "USER", activeOrgId: null, activeOrgRole: null }, "/dashboard/today"), true);
  });
});
