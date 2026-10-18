import test from "node:test";
import assert from "node:assert/strict";
import { mobileExpenditureInputSchema, mobileNoticeReadSchema, mobileProfileInputSchema } from "../../packages/contracts/src/mobile";
import { canAccessWorkspacePath } from "../../apps/web/src/lib/permissions/workspace-access";
import { tenantPathRequiresActiveLease } from "../../apps/web/src/lib/permissions/access";
const valid = { description: "Fixture repair", amount: 120.50, incurredAt: "2026-10-18", category: "TENANT_REPAIR" };
test("native expenses reject invalid dates, precision, amounts and categories", () => {
  assert.ok(mobileExpenditureInputSchema.safeParse(valid).success);
  for (const fields of [{ incurredAt: "2026-02-30" }, { incurredAt: "not-a-date" }, { amount: 0 }, { amount: -1 }, { amount: 1.001 }, { amount: Infinity }, { category: "ORG_UTILITY" }, { description: "a" }]) assert.equal(mobileExpenditureInputSchema.safeParse({ ...valid, ...fields }).success, false);
  const parsed = mobileExpenditureInputSchema.parse({ ...valid, tenantId: "other", orgId: "other", status: "APPROVED" });
  assert.ok(!("tenantId" in parsed) && !("orgId" in parsed) && !("status" in parsed));
});
test("native tenant additions use the same role, section and active-lease policy as the web", () => {
  for (const section of ["community", "expenditures"] as const) {
    const path = `/dashboard/tenant/${section}`;
    assert.equal(tenantPathRequiresActiveLease(path), true);
    const tenant = { platformRole: "USER" as const, activeOrgRole: "TENANT" as const, activeOrgId: "org" };
    assert.equal(canAccessWorkspacePath(tenant, path), true);
    assert.equal(canAccessWorkspacePath({ ...tenant, activeOrgRole: "CARETAKER" }, path), false);
    assert.equal(canAccessWorkspacePath({ ...tenant, orgRolePolicy: { blockedViews: [section === "expenditures" ? "accounting" : section], permissions: {} } }, path), false);
  }
});
test("notice acknowledgement bounds recipient identifiers", () => {
  assert.ok(mobileNoticeReadSchema.safeParse({ id: "recipient" }).success);
  assert.equal(mobileNoticeReadSchema.safeParse({ id: "" }).success, false);
  assert.equal(mobileNoticeReadSchema.safeParse({ id: "a".repeat(201) }).success, false);
});

test("profile validation preserves web contact limits and excludes identity fields", () => {
  const input = { phone: "+254700000000", email: "tenant@example.test", nextOfKinName: "Fixture contact", nextOfKinRelationship: "Sibling", nextOfKinPhone: "+254700000001", nextOfKinEmail: "" };
  const parsed = mobileProfileInputSchema.parse({ ...input, fullName: "Forged name", nationalId: "forged", userId: "other" });
  assert.ok(!("fullName" in parsed) && !("nationalId" in parsed) && !("userId" in parsed));
  for (const change of [{ phone: "" }, { nextOfKinName: "" }, { email: "bad-address" }, { nextOfKinEmail: "bad-address" }, { phone: "1".repeat(31) }]) assert.equal(mobileProfileInputSchema.safeParse({ ...input, ...change }).success, false);
});
