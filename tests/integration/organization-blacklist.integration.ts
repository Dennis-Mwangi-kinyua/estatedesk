import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { configureTestDatabase } from "./database-safety";
const databaseUrl = configureTestDatabase();

test("organization blacklist denies all associated identities across organizations and revokes sessions and keys", { skip: !databaseUrl }, async () => {
  const { prisma } = await import("../../apps/web/src/lib/prisma");
  const { assertUserNotBlacklisted, changeOrganizationBlacklist } = await import("../../apps/web/src/lib/organizations/blacklist");
  const tag = randomUUID();
  const orgs = await Promise.all(["locked", "other", "second"].map(name => prisma.organization.create({ data: { name: `${name}-${tag}`, slug: `${name}-${tag}` } })));
  const [org, other, second] = orgs;
  const users = await Promise.all(["admin", "staff", "tenant", "landlord", "former", "unrelated", "operator"].map(name => prisma.user.create({ data: { fullName: `${name}-${tag}`, passwordHash: "test-only", platformRole: name === "admin" || name === "operator" ? "PLATFORM_ADMIN" : "USER" } })));
  const [admin, staff, tenant, landlord, former, unrelated, operator] = users;
  const ids = users.map(u => u.id);
  try {
    await prisma.membership.createMany({ data: [
      { orgId: org.id, userId: staff.id, role: "MANAGER" },
      { orgId: other.id, userId: staff.id, role: "ADMIN" },
      { orgId: org.id, userId: former.id, role: "OFFICE", employmentEndedAt: new Date(), deactivatedAt: new Date() },
      { orgId: org.id, userId: operator.id, role: "ADMIN" },
      { orgId: second.id, userId: staff.id, role: "ADMIN" },
    ] });
    await prisma.tenant.create({ data: { orgId: org.id, userId: tenant.id, fullName: "Tenant", phone: "+254700000000" } });
    await prisma.landlordProfile.create({ data: { orgId: org.id, userId: landlord.id, displayName: "Owner" } });
    await prisma.userSession.createMany({ data: users.map(u => ({ userId: u.id, tokenHash: randomUUID(), expiresAt: new Date(Date.now() + 3600000) })) });
    await prisma.apiKey.createMany({ data: [
      { orgId: org.id, createdById: admin.id, name: "Locked org", keyHash: randomUUID() },
      { orgId: other.id, createdById: staff.id, name: "Affected creator in another org", keyHash: randomUUID() },
      { orgId: other.id, createdById: unrelated.id, name: "Unaffected key", keyHash: randomUUID() },
    ] });
    await changeOrganizationBlacklist({ orgId: org.id, actorUserId: admin.id, locked: true, reason: "Confirmed policy breach" });
    for (const user of [staff, tenant, landlord, operator]) {
      await assert.rejects(assertUserNotBlacklisted(user.id), { name: "OrganizationBlacklistedError" });
      assert.equal(await prisma.userSession.count({ where: { userId: user.id } }), 0);
    }
    for (const user of [former, unrelated, admin]) {
      await assertUserNotBlacklisted(user.id);
      assert.equal(await prisma.userSession.count({ where: { userId: user.id } }), 1);
    }
    assert.equal(await prisma.apiKey.count({ where: { orgId: { in: orgs.map(o => o.id) }, isActive: true } }), 1);
    assert.equal((await prisma.organization.findUniqueOrThrow({ where: { id: org.id } })).status, "DISABLED");
    await changeOrganizationBlacklist({ orgId: second.id, actorUserId: admin.id, locked: true, reason: "Another independent lock" });
    await changeOrganizationBlacklist({ orgId: org.id, actorUserId: admin.id, locked: false, reason: "Review completed" });
    await assert.rejects(assertUserNotBlacklisted(staff.id), { name: "OrganizationBlacklistedError" });
    await assertUserNotBlacklisted(tenant.id);
    assert.equal(await prisma.userSession.count({ where: { userId: tenant.id } }), 0);
    assert.equal((await prisma.organization.findUniqueOrThrow({ where: { id: org.id } })).status, "DISABLED");
    assert.equal(await prisma.auditLog.count({ where: { orgId: org.id, action: { in: ["ORGANIZATION_BLACKLISTED", "ORGANIZATION_UNBLACKLISTED"] } } }), 2);
  } finally {
    await prisma.auditLog.deleteMany({ where: { orgId: { in: orgs.map(o => o.id) } } });
    await prisma.organization.deleteMany({ where: { id: { in: orgs.map(o => o.id) } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  }
});
