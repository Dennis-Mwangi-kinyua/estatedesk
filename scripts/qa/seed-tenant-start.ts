import { writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { configureTestDatabase } from "../../tests/integration/database-safety";
import { fixture } from "../../tests/integration/move-out-fixture";
async function main() {
  if (!configureTestDatabase()) throw new Error("TEST_DATABASE_URL required");
  const f = await fixture();
  const [{ executeCreateTenantTransaction }, { createSessionCookieValue, getSessionCookieName }, { hashOpaqueToken }, { nairobiDate }] = await Promise.all([
    import("../../apps/web/src/features/tenants/actions/_lib/create-tenant-transaction"), import("../../apps/web/src/lib/auth/cookies"), import("../../apps/web/src/lib/crypto/tokens"), import("../../apps/web/src/lib/move-outs/validation"),
  ]);
  await f.prisma.subscription.create({ data: { orgId: f.org.id, status: "ACTIVE", currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 30 * 86400000) } });
  const unit = await f.prisma.unit.create({ data: { propertyId: f.unit.propertyId, houseNo: "START", rentAmount: 15000, depositAmount: 15000, status: "VACANT" } });
  const suffix = Date.now().toString();
  await executeCreateTenantTransaction({ orgId: f.org.id, fullName: "New tenancy browser tenant", phone: `2549${suffix.slice(-8)}`, email: null, nationalId: null, kraPin: null, notes: null, statusRaw: "ACTIVE", nextOfKinName: "Kin", nextOfKinRelationship: "Sibling", nextOfKinPhone: "254700000000", nextOfKinEmail: null, unitId: unit.id, leaseStartDate: new Date(`${nairobiDate()}T00:00:00Z`), dueDay: 5, monthlyRent: null, deposit: null, username: `start${suffix}`, password: "Test-only-password-123" });
  const lease = await f.prisma.lease.findFirstOrThrow({ where: { unitId: unit.id }, include: { tenant: true } });
  const historicalUnit = await f.prisma.unit.create({ data: { propertyId: f.unit.propertyId, houseNo: "PREVIOUS", rentAmount: 1000 } });
  const historicalLease = await f.prisma.lease.create({ data: { orgId: f.org.id, tenantId: lease.tenantId, unitId: historicalUnit.id, monthlyRent: 1000, startDate: new Date("2025-01-01T00:00:00Z"), endDate: new Date("2025-02-01T00:00:00Z"), status: "TERMINATED" } });
  await f.prisma.rentCharge.create({ data: { orgId: f.org.id, leaseId: historicalLease.id, period: "2025-01", chargeType: "RENT", amountDue: 1000, amountPaid: 0, balance: 0, dueDate: historicalLease.startDate, status: "WAIVED" } });
  await f.prisma.user.update({ where: { id: lease.tenant.userId! }, data: { mustChangePassword: false, termsAcceptedAt: new Date() } });
  const outsider = await f.prisma.user.create({ data: { fullName: "Unrelated tenant", passwordHash: "test-only", email: `outside-start-${suffix}@example.test`, termsAcceptedAt: new Date() } });
  const cookies: Record<string, { name: string; value: string; secure: boolean }> = {};
  for (const [label, userId, role] of [["manager", f.actor.id, "MANAGER"], ["tenant", lease.tenant.userId!, "TENANT"], ["outsider", outsider.id, "TENANT"]] as const) {
    const membership = await f.prisma.membership.upsert({ where: { orgId_userId_role_scopeType_scopeId: { orgId: f.org.id, userId, role, scopeType: "ORG", scopeId: "ORG_SCOPE" } }, create: { orgId: f.org.id, userId, role }, update: {} });
    const token = randomBytes(32).toString("hex");
    await f.prisma.userSession.create({ data: { userId, activeMembershipId: membership.id, tokenHash: hashOpaqueToken(token, "session"), expiresAt: new Date(Date.now() + 86400000) } });
    cookies[label] = { name: getSessionCookieName(), value: createSessionCookieValue(token), secure: process.env.NODE_ENV === "production" };
  }
  await writeFile("/tmp/estatedesk-tenant-start-browser-fixture.json", JSON.stringify({ orgId: f.org.id, leaseId: lease.id, tenantId: lease.tenantId, tenantSlug: lease.tenant.slug, day: nairobiDate(), cookies }), { mode: 0o600 });
  await f.prisma.$disconnect();
  console.log("Isolated initial-charge browser fixture created.");
}
main().catch(error => { console.error(error); process.exit(1); });
