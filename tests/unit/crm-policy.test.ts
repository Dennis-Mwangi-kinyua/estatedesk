import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { activitySchema, dealSchema, leadSchema, tenantCrmWhere } from "../../apps/web/src/features/crm/policy";
import { canAccessWorkspacePath } from "../../apps/web/src/lib/permissions/workspace-access";

const deal = { salesStage: "QUALIFIED", salesOwnerId: "", customerOrgId: "", expectedMonthlyValue: "", currencyCode: "KES", targetPlan: "", demoAt: "", lostReason: "", updatedAt: "2026-11-09T09:00:00.000Z" };
describe("CRM sales validation", () => {
  it("requires an organization for won deals, a lost reason, and a demo appointment", () => {
    assert.equal(dealSchema.safeParse({ ...deal, salesStage: "WON" }).success, false);
    assert.equal(dealSchema.safeParse({ ...deal, salesStage: "WON", customerOrgId: "customer" }).success, true);
    assert.equal(dealSchema.safeParse({ ...deal, salesStage: "LOST" }).success, false);
    assert.equal(dealSchema.safeParse({ ...deal, salesStage: "LOST", lostReason: "Budget" }).success, true);
    assert.equal(dealSchema.safeParse({ ...deal, salesStage: "DEMO_SCHEDULED" }).success, false);
    assert.equal(dealSchema.safeParse({ ...deal, salesStage: "DEMO_SCHEDULED", demoAt: "2026-11-10T10:00:00+03:00" }).success, true);
  });
  it("distinguishes unset values from zero and rejects invalid amounts and currencies", () => {
    assert.equal(dealSchema.parse(deal).expectedMonthlyValue, "");
    assert.equal(dealSchema.parse({ ...deal, expectedMonthlyValue: "0" }).expectedMonthlyValue, 0);
    for (const expectedMonthlyValue of ["-1", "NaN", "Infinity", "10000000000"]) assert.equal(dealSchema.safeParse({ ...deal, expectedMonthlyValue }).success, false);
    assert.equal(dealSchema.safeParse({ ...deal, currencyCode: "kes" }).success, false);
    assert.equal(dealSchema.safeParse({ ...deal, salesStage: "INVALID" }).success, false);
  });
  it("validates contact details and trims prospect information", () => {
    const lead = { fullName: " Jane Doe ", companyName: " Example ", workEmail: "jane@example.com", phone: "", managedPropertyType: "Residential", message: "" };
    assert.equal(leadSchema.parse(lead).fullName, "Jane Doe");
    assert.equal(leadSchema.safeParse({ ...lead, workEmail: "invalid" }).success, false);
  });
});
describe("CRM activity validation", () => {
  const activity = { kind: "TASK", body: "Call customer", assigneeId: "", dueAt: "2026-11-10T08:00:00Z" };
  it("requires dates for tasks and demos and rejects ambiguous local timestamps", () => {
    assert.equal(activitySchema.safeParse(activity).success, true);
    for (const kind of ["TASK", "DEMO"]) assert.equal(activitySchema.safeParse({ ...activity, kind, dueAt: "" }).success, false);
    assert.equal(activitySchema.safeParse({ ...activity, dueAt: "2026-11-10T08:00" }).success, false);
    assert.equal(activitySchema.safeParse({ ...activity, kind: "NOTE", dueAt: "" }).success, true);
    assert.equal(activitySchema.safeParse({ ...activity, body: "   " }).success, false);
    assert.equal(activitySchema.safeParse({ ...activity, priority: "FAKE" }).success, false);
  });
});
describe("CRM workspace isolation", () => {
  it("limits organization-wide access to the owning organization and excludes deleted customers", () => {
    assert.deepEqual(tenantCrmWhere("org-a", { scopeType: "ORG", scopeId: "org-a" }), { orgId: "org-a", deletedAt: null });
  });
  it("requires scoped staff to have a customer lease in their assigned unit or property", () => {
    const scoped = tenantCrmWhere("org-a", { scopeType: "UNIT", scopeId: "unit-a" });
    assert.equal(scoped.orgId, "org-a");
    assert.deepEqual(scoped.leases, { some: { deletedAt: null, unit: { deletedAt: null, property: { orgId: "org-a", deletedAt: null }, id: "unit-a" } } });
    assert.match(JSON.stringify(tenantCrmWhere("org-a", null)), /"in":\[\]/);
  });
  it("grants CRM to organization operations staff and platform administrators", () => {
    for (const role of ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "TENANT", "CARETAKER", "LANDLORD", "SECURITY"] as const) {
      const session = { platformRole: "USER" as const, activeOrgId: "org", activeOrgRole: role };
      assert.equal(canAccessWorkspacePath(session, "/dashboard/org/crm/tasks"), ["ADMIN", "MANAGER", "OFFICE"].includes(role), role);
      assert.equal(canAccessWorkspacePath(session, "/platform/crm"), false);
    }
    assert.equal(canAccessWorkspacePath({ platformRole: "PLATFORM_ADMIN", activeOrgId: null, activeOrgRole: null }, "/platform/crm/customers"), true);
    for (const blockedView of ["tenants", "crm"] as const) assert.equal(canAccessWorkspacePath({ platformRole: "USER", activeOrgId: "org", activeOrgRole: "OFFICE", orgRolePolicy: { permissions: {}, blockedViews: [blockedView] } }, "/dashboard/org/crm"), false);
  });
});
