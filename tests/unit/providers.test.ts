import assert from "node:assert/strict";
import test from "node:test";
import { jobSchema, profileSchema, reviewSchema, providerIsOnline, ONLINE_WINDOW_MS } from "../../apps/web/src/features/providers/policy";
import { getRedirectAfterLogin } from "../../apps/web/src/lib/auth/redirect-after-login";
import { canAccessWorkspacePath } from "../../apps/web/src/lib/permissions/workspace-access";
test("provider input restricts portfolios to HTTPS and rating to whole stars", () => {
  const profile = { businessName: "Local plumber", category: "Plumbing", location: "Nairobi", bio: "Repairs and installations for residential apartments.", portfolioUrl: "https://example.com/work" };
  assert.equal(profileSchema.safeParse(profile).success, true);
  for (const portfolioUrl of ["javascript:alert(1)", "http://example.com", "//example.com"]) assert.equal(profileSchema.safeParse({ ...profile, portfolioUrl }).success, false);
  for (const rating of [0, 6, 2.5]) assert.equal(reviewSchema.safeParse({ rating, comment: "Good work" }).success, false);
  assert.equal(jobSchema.safeParse({ title: "Fix leaking tap", category: "Plumbing", location: "Nairobi", description: "Replace a leaking tap in the shared kitchen", budget: "-100" }).success, false);
});
test("online status expires after five minutes and rejects future timestamps", () => {
  const now = new Date();
  assert.equal(providerIsOnline(new Date(now.getTime() - ONLINE_WINDOW_MS), now), true);
  assert.equal(providerIsOnline(new Date(now.getTime() - ONLINE_WINDOW_MS - 1), now), false);
  assert.equal(providerIsOnline(new Date(now.getTime() + 1), now), false);
  assert.equal(providerIsOnline(null, now), false);
});
test("provider-only accounts sign in to their portal without gaining organisation privileges", () => {
  const account = { platformRole: "USER" as const, activeOrgId: null, activeOrgRole: null, hasTenantProfile: false, hasServiceProvider: true };
  assert.equal(getRedirectAfterLogin(account), "/provider");
  assert.equal(canAccessWorkspacePath(account, "/dashboard/org/service-providers"), false);
  for (const role of ["ADMIN", "MANAGER", "OFFICE"] as const) assert.equal(canAccessWorkspacePath({ ...account, activeOrgId: "org", activeOrgRole: role }, "/dashboard/org/service-providers"), true);
  for (const role of ["TENANT", "CARETAKER", "ACCOUNTANT"] as const) assert.equal(canAccessWorkspacePath({ ...account, activeOrgId: "org", activeOrgRole: role }, "/dashboard/org/service-providers"), false);
});
