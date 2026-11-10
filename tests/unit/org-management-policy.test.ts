import test from "node:test";
import assert from "node:assert/strict";
import type { AppSession } from "../../apps/web/src/lib/auth/session";
import { assertManagementSession, canReview, dateInput, endOfDay, moneyInput, performanceMetrics, promiseProgress } from "../../apps/web/src/features/org-management/policy";
const session = (role: AppSession["activeOrgRole"] = "ADMIN"): AppSession => ({ userId: "actor", fullName: "Actor", email: null, activeOrgId: "org", activeOrgRole: role, platformRole: "USER", mustChangePassword: false, requiresTermsAcceptance: false, membershipScope: { scopeType: "ORG", scopeId: "org" } });
test("management requires an organization-wide role and respects blocked views and explicit denials", () => {
  assert.equal(assertManagementSession(session(), "approvals"), "org");
  for (const role of ["TENANT", "CARETAKER", "SECURITY", "LANDLORD"] as const) assert.throws(() => assertManagementSession(session(role), "approvals"));
  assert.throws(() => assertManagementSession({ ...session(), membershipScope: { scopeType: "PROPERTY", scopeId: "property" } }, "performance"));
  assert.throws(() => assertManagementSession({ ...session(), membershipScope: null }, "collections"));
  assert.throws(() => assertManagementSession({ ...session(), orgRolePolicy: { permissions: {}, blockedViews: ["leases"] } }, "renewals"));
  assert.throws(() => assertManagementSession({ ...session(), orgRolePolicy: { permissions: { "reports.view": "deny" }, blockedViews: [] } }, "performance"));
  assert.throws(() => assertManagementSession({ ...session(), mustChangePassword: true }, "handovers"));
});
test("monetary approval limits and sensitive change permissions are enforced", () => {
  assert.equal(canReview(session("MANAGER"), "EXPENSE", 500, 500), true);
  assert.equal(canReview(session("MANAGER"), "EXPENSE", 501, 500), false);
  assert.equal(canReview(session("ACCOUNTANT"), "WRITE_OFF", 50, 100), true);
  assert.equal(canReview(session("OFFICE"), "EXPENSE", 50, 100), false);
  assert.equal(canReview(session("MANAGER"), "RENT_CHANGE", 50, 100), false);
  assert.equal(canReview(session(), "STAFF_ACCESS", 0, 0), true);
  assert.equal(canReview({ ...session(), orgRolePolicy: { permissions: { "leases.manage": "deny" }, blockedViews: [] } }, "RENT_CHANGE", 50, 0), false);
});
test("amount and Nairobi calendar parsing rejects invalid or imprecise inputs", () => {
  for (const value of ["-1", "1.001", "NaN", "Infinity", "1e3", "0"]) assert.equal(moneyInput.safeParse(value).success, false);
  assert.equal(moneyInput.safeParse("123.45").success, true);
  assert.equal(dateInput.safeParse("2027-02-29").success, false);
  assert.equal(dateInput.safeParse("2028-02-29").success, true);
  assert.equal(endOfDay("2026-11-10").toISOString(), "2026-11-10T20:59:59.999Z");
});
test("promise outcomes reflect payment reversals, partial fulfilment and due-day boundaries", () => {
  const due = endOfDay("2026-11-10");
  assert.equal(promiseProgress(100, 200, 250, due, new Date("2026-11-10T20:00:00Z")).status, "OPEN");
  assert.equal(promiseProgress(100, 200, 250, due, new Date("2026-11-10T21:00:00Z")).status, "BROKEN");
  assert.equal(promiseProgress(100, 200, 300, due).status, "FULFILLED");
  assert.equal(promiseProgress(100, 200, 150, due).received, 0);
});
test("performance calculations handle empty portfolios and negative contribution", () => {
  assert.equal(performanceMetrics(0, 0, 10, 0, 0, 0).collectionRate, null);
  const result = performanceMetrics(1000, 800, 900, 200, 10, 2);
  assert.equal(result.netIncome, -100); assert.equal(result.collectionRate, 80); assert.equal(result.occupancyRate, 80);
});
