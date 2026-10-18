import test from "node:test";
import assert from "node:assert/strict";
import { mobilePortfolioQuerySchema, mobileWorkOrderInputSchema } from "../../packages/contracts/src/mobile";
import { mobileFeatures } from "../../apps/web/src/lib/mobile/features";
import { orgViewForPath } from "../../apps/web/src/lib/permissions/org-role-policy";

test("mobile workspaces follow roles and blocked views", () => {
  assert.deepEqual(mobileFeatures({ activeOrgId: "org", activeOrgRole: "TENANT" }), ["leases", "move-outs", "documents", "visitors"]);
  assert.deepEqual(mobileFeatures({ activeOrgId: "org", activeOrgRole: "CARETAKER" }), ["caretaker-issues", "inspections", "gate"]);
  assert.deepEqual(mobileFeatures({ activeOrgId: "org", activeOrgRole: "OFFICE" }), ["portfolio", "gate"]);
  assert.deepEqual(mobileFeatures({ activeOrgId: "org", activeOrgRole: "ACCOUNTANT" }), ["payment-review"]);
  assert.deepEqual(mobileFeatures({ activeOrgId: null, activeOrgRole: "TENANT" }), []);
  assert.deepEqual(mobileFeatures({ activeOrgId: "org", activeOrgRole: "TENANT", orgRolePolicy: { permissions: {}, blockedViews: ["leases"] } }), ["move-outs", "documents", "visitors"]);
  assert.deepEqual(mobileFeatures({ activeOrgId: "org", activeOrgRole: "MANAGER", orgRolePolicy: { permissions: {}, blockedViews: ["properties"] } }), ["gate", "payment-review"]);
  assert.equal(orgViewForPath("/api/mobile/org/units"), "properties");
  assert.equal(orgViewForPath("/api/mobile/tenant/leases"), "leases");
  assert.equal(orgViewForPath("/api/mobile/tenant/move-outs"), "move-outs");
});

test("native work-order mutations are bounded and action specific", () => {
  assert.equal(mobileWorkOrderInputSchema.safeParse({ action: "complete", issueId: "issue", workSummary: "short" }).success, false);
  assert.equal(mobileWorkOrderInputSchema.safeParse({ action: "note", issueId: "issue", progressNote: "x".repeat(2001) }).success, false);
  assert.equal(mobileWorkOrderInputSchema.safeParse({ action: "close", issueId: "issue" }).success, false);
  assert.deepEqual(mobileWorkOrderInputSchema.parse({ action: "start", issueId: "issue", orgId: "forged" }), { action: "start", issueId: "issue" });
  assert.deepEqual(mobileWorkOrderInputSchema.parse({ action: "complete", issueId: "issue", workSummary: "Replaced the leaking tap." }), { action: "complete", issueId: "issue", workSummary: "Replaced the leaking tap.", materialsUsed: "", tenantInstructions: "" });
  for (const invalid of [{ page: "-1" }, { page: "1.5" }, { page: "Infinity" }, { q: "x".repeat(101) }, { status: "DELETED" }]) assert.equal(mobilePortfolioQuerySchema.safeParse(invalid).success, false);
});
