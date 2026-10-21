import assert from "node:assert/strict";
import { test } from "node:test";
import { trustedLoginIp, loginRateLimits, accountLoginRateLimit } from "../../apps/web/src/lib/auth/login-policy";
import { paymentProofWhere } from "../../apps/web/src/lib/payments/proof-access";
import type { AppSession } from "../../apps/web/src/lib/auth/session";
import { redeemPasswordLink } from "../../apps/web/src/lib/auth/redeem-password-link";

const session: AppSession = { userId: "user", email: null, fullName: "Test", platformRole: "USER", activeOrgId: "org", activeOrgRole: "TENANT", mustChangePassword: false, requiresTermsAcceptance: false, membershipScope: { scopeType: "ORG", scopeId: "ORG_SCOPE" } };
test("untrusted forwarding headers cannot rotate login buckets", () => {
  const headers = new Headers({ "x-forwarded-for": "1.2.3.4", "cf-connecting-ip": "5.6.7.8" });
  assert.equal(trustedLoginIp(headers, ""), "unknown");
  assert.equal(trustedLoginIp(headers, "arbitrary-header"), "unknown");
  assert.equal(trustedLoginIp(headers, "cf-connecting-ip"), "5.6.7.8");
  assert.equal(trustedLoginIp(new Headers({ "x-real-ip": "forged" }), "x-real-ip"), "unknown");
});
test("account limits survive IP rotation, case changes, and login aliases", () => {
  const first = loginRateLimits("Person@Example.test", "1.2.3.4").at(-1)!;
  const rotated = loginRateLimits(" person@example.test ", "5.6.7.8").at(-1)!;
  assert.deepEqual(first, rotated);
  assert.ok(!first.key.includes("person@example.test"));
  const counts = new Map<string, number>();
  let blocked = false;
  for (let i = 0; i <= first.limit; i++) {
    const bucket = loginRateLimits("person@example.test", `192.0.2.${i}`).at(-1)!;
    const count = (counts.get(bucket.key) ?? 0) + 1;
    counts.set(bucket.key, count);
    blocked = count > bucket.limit;
  }
  assert.equal(blocked, true);
  assert.deepEqual(accountLoginRateLimit("user"), accountLoginRateLimit(session.userId));
});
test("proof access binds tenant identity and organization and fails closed for setup", () => {
  assert.deepEqual(paymentProofWhere(session, "payment"), { id: "payment", orgId: "org", OR: [{ payerUserId: "user" }, { payerTenant: { userId: "user" } }] });
  for (const change of [{ activeOrgId: null }, { mustChangePassword: true }, { requiresTermsAcceptance: true }, { activeOrgRole: "CARETAKER" as const }]) assert.equal(paymentProofWhere({ ...session, ...change }, "payment"), null);
  const manager = { ...session, activeOrgRole: "MANAGER" as const, membershipScope: { scopeType: "PROPERTY" as const, scopeId: "property" } };
  const filter = paymentProofWhere(manager, "payment");
  assert.ok(filter);
  assert.ok(JSON.stringify(filter).includes("property"));
  assert.ok(JSON.stringify(filter).includes('"orgId":"org"'));
  assert.ok(JSON.stringify(paymentProofWhere({ ...manager, membershipScope: null }, "payment")).includes('"in":[]'));
});
test("used or expired setup links never change passwords or revoke sessions", async () => {
  const calls: string[] = [];
  const tx = { passwordResetToken: { updateMany: async () => ({ count: 0 }) }, user: { update: async () => calls.push("password") }, userSession: { deleteMany: async () => calls.push("sessions") } };
  assert.equal(await redeemPasswordLink(tx as unknown as Parameters<typeof redeemPasswordLink>[0], { tokenId: "used", userId: "user", email: "", passwordHash: "hash" }), false);
  assert.deepEqual(calls, []);
});
