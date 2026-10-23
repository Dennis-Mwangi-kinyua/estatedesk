import { randomBytes, randomUUID } from "node:crypto";
import { writeFile, chmod } from "node:fs/promises";
import { configureTestDatabase } from "../../tests/integration/database-safety";

async function main() {
  // Never seed load-test accounts in an arbitrary remote or production database.
  if (!configureTestDatabase()) throw new Error("A disposable local TEST_DATABASE_URL is required.");
  if (!process.env.AUTH_SECRET) throw new Error("Set an isolated AUTH_SECRET for the test server and fixture.");
  const count = Number(process.env.CAPACITY_USERS ?? 1000);
  if (!Number.isInteger(count) || count < 1000 || count > 10000) throw new Error("CAPACITY_USERS must be between 1000 and 10000.");
  const output = process.env.LOAD_SESSIONS_FILE;
  if (!output) throw new Error("LOAD_SESSIONS_FILE must name a private output file outside the repository.");
  const { resolve, relative } = await import("node:path");
  const rel = relative(process.cwd(), resolve(output));
  if (!rel.startsWith("..") && !rel.startsWith("/")) throw new Error("Session fixtures must be stored outside the repository.");
  const [{ prisma }, { hashOpaqueToken }, { createSessionCookieValue, getSessionCookieName }] = await Promise.all([
    import("../../apps/web/src/lib/prisma"),
    import("../../apps/web/src/lib/crypto/tokens"),
    import("../../apps/web/src/lib/auth/cookies"),
  ]);
  const run = randomUUID();
  const usersPerOrg = 50;
  const sessions: { userId: string; cookieHeader: string }[] = [];
  const expiresAt = new Date(Date.now() + 86400000);
  try {
    for (let start = 0; start < count; start += usersPerOrg) {
      const orgId = `capacity-${run}-${start}`;
      const propertyId = `${orgId}-property`;
      await prisma.organization.create({ data: { id: orgId, name: `Fictional capacity org ${start}`, slug: orgId } });
      await prisma.subscription.create({ data: { orgId, plan: "ENTERPRISE", status: "ACTIVE", currentPeriodStart: new Date(), currentPeriodEnd: expiresAt } });
      await prisma.property.create({ data: { id: propertyId, orgId, name: "Fictional capacity property", location: "Nairobi" } });
      const numbers = Array.from({ length: Math.min(usersPerOrg, count - start) }, (_, i) => start + i);
      await prisma.user.createMany({ data: numbers.map(i => ({ id: `${orgId}-user-${i}`, email: `capacity-${run}-${i}@example.test`, fullName: `Fictional manager ${i}`, passwordHash: "capacity-fixture-no-password-login", termsAcceptedAt: new Date() })) });
      await prisma.membership.createMany({ data: numbers.map(i => ({ id: `${orgId}-member-${i}`, orgId, userId: `${orgId}-user-${i}`, role: "MANAGER" as const })) });
      await prisma.unit.createMany({ data: numbers.map(i => ({ id: `${orgId}-unit-${i}`, propertyId, houseNo: `TEST-${i}`, rentAmount: 10000, status: "OCCUPIED" as const })) });
      await prisma.tenant.createMany({ data: numbers.map(i => ({ id: `${orgId}-tenant-${i}`, orgId, fullName: `Fictional tenant ${i}`, phone: `test-${run}-${i}` })) });
      await prisma.lease.createMany({ data: numbers.map(i => ({ id: `${orgId}-lease-${i}`, orgId, unitId: `${orgId}-unit-${i}`, tenantId: `${orgId}-tenant-${i}`, monthlyRent: 10000, deposit: 10000, startDate: new Date(Date.now() - 86400000 * 30) })) });
      await prisma.rentCharge.createMany({ data: numbers.map(i => ({ orgId, leaseId: `${orgId}-lease-${i}`, period: new Date().toISOString().slice(0, 7), chargeType: "RENT" as const, amountDue: 10000, amountPaid: 0, balance: 10000, dueDate: new Date() })) });
      const records = numbers.map(i => {
        const token = randomBytes(32).toString("hex");
        const userId = `${orgId}-user-${i}`;
        sessions.push({ userId, cookieHeader: `${getSessionCookieName()}=${createSessionCookieValue(token)}` });
        return { userId, activeMembershipId: `${orgId}-member-${i}`, tokenHash: hashOpaqueToken(token, "session"), expiresAt };
      });
      await prisma.userSession.createMany({ data: records });
    }
    await writeFile(output, JSON.stringify(sessions), { mode: 0o600 });
    await chmod(output, 0o600);
    console.log(JSON.stringify({ users: count, organizations: Math.ceil(count / usersPerOrg), units: count, tenants: count, leases: count, rentCharges: count, fixture: "Private session file created; passwords and cookies omitted." }));
  } finally { await prisma.$disconnect(); }
}

main().catch(error => { console.error(error instanceof Error ? error.message : "Capacity seeding failed"); process.exitCode = 1; });
