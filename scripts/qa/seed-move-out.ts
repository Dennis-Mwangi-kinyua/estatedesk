import { writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { configureTestDatabase } from "../../tests/integration/database-safety";
import { fixture } from "../../tests/integration/move-out-fixture";
async function main() {
  if (!configureTestDatabase()) throw new Error("TEST_DATABASE_URL required");
  const f = await fixture();
  await f.prisma.subscription.create({ data: { orgId: f.org.id, status: "ACTIVE", currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 30 * 86400000) } });
  const [{ createSessionCookieValue, getSessionCookieName }, { hashOpaqueToken }, { nairobiDate }] = await Promise.all([import("../../apps/web/src/lib/auth/cookies"), import("../../apps/web/src/lib/crypto/tokens"), import("../../apps/web/src/lib/move-outs/validation")]);
  const tenantUser = await f.prisma.user.create({ data: { fullName: "Moveout tenant", email: `tenant-${f.notice.id}@example.test`, passwordHash: "not-a-login-password", termsAcceptedAt: new Date() } });
  await f.prisma.tenant.update({ where: { id: f.tenant.id }, data: { userId: tenantUser.id } });
  const outsider = await f.prisma.user.create({ data: { fullName: "Other tenant", email: `other-${f.notice.id}@example.test`, passwordHash: "not-a-login-password", termsAcceptedAt: new Date() } });
  const cookies: Record<string, { name: string; value: string }> = {};
  for (const [label, userId, role] of [["manager", f.actor.id, "MANAGER"], ["tenant", tenantUser.id, "TENANT"], ["outsider", outsider.id, "TENANT"]] as const) {
    const membership = await f.prisma.membership.create({ data: { orgId: f.org.id, userId, role } });
    const token = randomBytes(32).toString("hex");
    await f.prisma.userSession.create({ data: { userId, activeMembershipId: membership.id, tokenHash: hashOpaqueToken(token, "session"), expiresAt: new Date(Date.now() + 86400000) } });
    cookies[label] = { name: getSessionCookieName(), value: createSessionCookieValue(token) };
  }
  await writeFile("/tmp/estatedesk-moveout-browser-fixture.json", JSON.stringify({ noticeId: f.notice.id, orgId: f.org.id, tenantId: f.tenant.id, unitId: f.unit.id, day: nairobiDate(), cookies }), { mode: 0o600 });
  await f.prisma.$disconnect();
  console.log("Isolated browser fixture created.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
