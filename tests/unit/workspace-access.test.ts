import assert from "node:assert/strict";
import { it } from "node:test";
import { canAccessWorkspacePath, ORG_WORKSPACE_ROLES } from "../../apps/web/src/lib/permissions/workspace-access";
import type { OrgRole } from "@prisma/client";
const roles: OrgRole[] = ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER", "TENANT", "LANDLORD"];
const session = (role: OrgRole) => ({ platformRole: "USER" as const, activeOrgId: "org", activeOrgRole: role });
it("allows staff to open a shared inspection report while keeping tenants out", () => {
  for (const role of roles) {
    assert.equal(canAccessWorkspacePath(session(role), "/inspections/inspection-id"), role !== "TENANT");
  }
  assert.equal(canAccessWorkspacePath(session("CARETAKER"), "/inspections/inspection-id/edit"), false);
});
it("enforces every section allowlist for dashboard and legacy URLs, including nested actions", () => {
  for (const role of roles) for (const [section, allowed] of Object.entries(ORG_WORKSPACE_ROLES)) {
    for (const path of [`/dashboard/org/${section}`, `/dashboard/org/${section}/record/edit`, `/${section}/record/edit`]) {
      assert.equal(canAccessWorkspacePath(session(role), path), allowed.includes(role), `${role}: ${path}`);
    }
  }
});
it("isolates role portals and rejects unknown or deceptive routes", () => {
  for (const role of roles) for (const [portal, owner] of [["tenant", "TENANT"], ["caretaker", "CARETAKER"], ["landlord", "LANDLORD"]]) {
    assert.equal(canAccessWorkspacePath(session(role), `/dashboard/${portal}/profile`), role === owner);
  }
  for (const path of ["/dashboard/org/unknown", "/dashboard/org/settings-extra", "/dashboard/tenant/../../org/settings", "/platform"]) {
    assert.equal(canAccessWorkspacePath(session("OFFICE"), path), false);
  }
  assert.equal(canAccessWorkspacePath({ ...session("ADMIN"), activeOrgId: null }, "/dashboard/org"), false);
  assert.equal(canAccessWorkspacePath({ ...session("TENANT"), platformRole: "SUPER_ADMIN" }, "/dashboard/org/settings"), false);
  assert.equal(canAccessWorkspacePath({ ...session("ADMIN"), platformRole: "SUPER_ADMIN" }, "/platform/users"), true);
});
