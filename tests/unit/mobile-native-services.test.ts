import test from "node:test";
import assert from "node:assert/strict";
import { mobileLeaseSigningInputSchema, mobileMoveOutInputSchema, mobileSecurityInputSchema, mobileRewardsSchema, mobileIssueConfirmationSchema } from "../../packages/contracts/src/mobile";
import { nativeTenantDestination } from "../../apps/mobile/src/native-tenant-navigation";
import { mobileSessionSchema } from "../../packages/contracts/src/mobile";
import { tenantWorkspaceLinks } from "../../packages/contracts/src/tenant-workspace";

test("every tenant menu destination except the overview has a native screen", () => {
  const session = mobileSessionSchema.parse({ fullName: "Tenant", role: "TENANT", organizationName: "Example", requiresAccountSetup: false, features: ["leases", "move-outs", "documents", "visitors"] });
  for (const [, path] of tenantWorkspaceLinks) {
    if (path !== "/dashboard/tenant") assert.ok(nativeTenantDestination(path, session), path);
  }
});
test("native signing requires explicit consent and binds the reviewed document hash", () => {
  const valid = { action: "sign", signerId: "signer", signatureText: "Tenant Name", consent: true, sourceDocumentHash: "reviewed-hash" };
  assert.ok(mobileLeaseSigningInputSchema.safeParse(valid).success);
  for (const change of [{ consent: false }, { sourceDocumentHash: "" }, { signatureText: " " }, { signerId: "" }, { action: "approve" }]) assert.equal(mobileLeaseSigningInputSchema.safeParse({ ...valid, ...change }).success, false);
  const parsed = mobileLeaseSigningInputSchema.parse({ ...valid, userId: "forged", orgId: "forged", signatureMethod: "FORGED" });
  assert.ok(!("userId" in parsed) && !("orgId" in parsed) && !("signatureMethod" in parsed));
  assert.equal(mobileLeaseSigningInputSchema.safeParse({ action: "decline", signerId: "signer", sourceDocumentHash: "hash", reason: "no" }).success, false);
});
test("native session and notice mutations reject missing targets and unbounded data", () => {
  for (const input of [{ action: "revoke", sessionId: "" }, { action: "password", currentPassword: "password", newPassword: "short", confirmPassword: "short" }, { action: "delete-user" }]) assert.equal(mobileSecurityInputSchema.safeParse(input).success, false);
  assert.deepEqual(mobileSecurityInputSchema.parse({ action: "revoke-others", userId: "other" }), { action: "revoke-others" });
  for (const input of [{ action: "withdraw", noticeId: "" }, { action: "submit", moveOutDate: "tomorrow", notes: "" }, { action: "submit", moveOutDate: "2026-11-10", notes: "a".repeat(1001) }]) assert.equal(mobileMoveOutInputSchema.safeParse(input).success, false);
  assert.equal(mobileIssueConfirmationSchema.safeParse({ issueId: "issue", reportId: "report", tenantFeedback: "a".repeat(2001) }).success, false);
});
test("top reward tier supports null next-tier values", () => {
  assert.ok(mobileRewardsSchema.safeParse({ points: 1000, availablePoints: 900, redeemedPoints: 100, tier: "PLATINUM", streakMonths: 12, earlyPayments: 12, onTimePayments: 0, nextTier: null, pointsToNextTier: null, catalog: [], redemptions: [] }).success);
});
