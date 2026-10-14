import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { configureTestDatabase } from "./database-safety";
const databaseUrl = configureTestDatabase();
test("global IDs reject duplicate people and approved requests link the existing account once", { skip: !databaseUrl }, async () => {
  const { prisma } = await import("../../apps/web/src/lib/prisma");
  const { linkVerifiedIdentity } = await import("../../apps/web/src/features/identity/service");
  const suffix = randomUUID();
  let legacyIdentityId: string | undefined;
  const number = suffix.replaceAll("-", "").slice(0, 20).toUpperCase();
  const org = await prisma.organization.create({ data: { name: "Original org", slug: `id-original-${suffix}` } });
  const target = await prisma.organization.create({ data: { name: "Target org", slug: `id-target-${suffix}` } });
  const user = await prisma.user.create({ data: { fullName: "Verified person", phone: `id-${suffix}`, passwordHash: "original-password-hash" } });
  const impostor = await prisma.user.create({ data: { fullName: "Another person", passwordHash: "different-hash" } });
  try {
    const tenant = await prisma.tenant.create({ data: { orgId: org.id, userId: user.id, fullName: user.fullName, phone: user.phone!, nationalId: number.toLowerCase().slice(0, 10) + "-" + number.slice(10) } });
    assert.equal(tenant.nationalId, number);
    await assert.rejects(prisma.serviceProvider.create({ data: { userId: impostor.id, businessName: "Duplicate identity", category: "Plumbing", location: "Nairobi", bio: "A different person sharing the same ID", nationalId: number } }), /ID_ALREADY_REGISTERED/);
    const membership = await prisma.membership.create({ data: { orgId: target.id, userId: impostor.id, role: "OFFICE" } });
    await assert.rejects(prisma.staffProfile.create({ data: { membershipId: membership.id, nationalId: number } }), /ID_ALREADY_REGISTERED/);
    await assert.rejects(prisma.landlordProfile.create({ data: { orgId: target.id, userId: impostor.id, displayName: "Another person", nationalId: number } }), /ID_ALREADY_REGISTERED/);
    const request = await prisma.identityVerificationRequest.create({ data: { orgId: target.id, number, fullName: user.fullName, phone: user.phone!, requestedRole: "TENANT", reason: "Verified person needs a tenancy in this organisation", requestedByUserId: impostor.id } });
    await assert.rejects(linkVerifiedIdentity(target.id, request.id, impostor.id), /approval/);
    await prisma.identityVerificationRequest.update({ where: { id: request.id }, data: { status: "APPROVED", verifiedUserId: user.id, reviewedAt: new Date(), reviewedByUserId: user.id, reviewNotes: "ID and applicant consent verified by platform" } });
    await assert.rejects(linkVerifiedIdentity(org.id, request.id, impostor.id), /approval/);
    const attempts = await Promise.allSettled([linkVerifiedIdentity(target.id, request.id, impostor.id), linkVerifiedIdentity(target.id, request.id, impostor.id)]);
    assert.equal(attempts.filter(attempt => attempt.status === "fulfilled").length, 1);
    const linked = await prisma.tenant.findFirstOrThrow({ where: { orgId: target.id, userId: user.id } });
    assert.equal(linked.nationalId, number);
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).passwordHash, "original-password-hash");
    assert.equal((await prisma.tenant.findUniqueOrThrow({ where: { id: tenant.id } })).orgId, org.id);
    assert.equal(await prisma.identityClaim.count({ where: { number } }), 1);
    await prisma.tenant.update({ where: { id: tenant.id }, data: { deletedAt: new Date() } });
    await assert.rejects(prisma.tenant.create({ data: { orgId: org.id, userId: impostor.id, fullName: "Another person", phone: "different-phone", nationalId: number } }), /ID_ALREADY_REGISTERED/);
    const { ensureTenantIdentity } = await import("../../apps/web/src/lib/tenants/identity");
    const legacy = await prisma.$transaction(async tx => {
      const tenant = await tx.tenant.create({ data: { orgId: org.id, fullName: "Legacy tenant", phone: `legacy-${suffix}`, nationalId: number + "L" } });
      const identity = await ensureTenantIdentity(tx, { tenantId: tenant.id, fullName: tenant.fullName, phone: tenant.phone, nationalId: tenant.nationalId });
      return { tenant, identity };
    });
    legacyIdentityId = legacy.identity.id;
    assert.equal((await prisma.identityClaim.findUniqueOrThrow({ where: { number: number + "L" } })).ownerKey, `identity:${legacy.identity.id}`);
    const anotherId = number + "1";
    const race = await Promise.allSettled([prisma.serviceProvider.create({ data: { userId: user.id, businessName: "Real person", category: "Plumbing", location: "Nairobi", bio: "A provider portfolio for the real person", nationalId: anotherId } }), prisma.serviceProvider.create({ data: { userId: impostor.id, businessName: "Other person", category: "Plumbing", location: "Nairobi", bio: "A provider portfolio for another person", nationalId: anotherId } })]);
    assert.equal(race.filter(attempt => attempt.status === "fulfilled").length, 1);
  } finally {
    await prisma.organization.deleteMany({ where: { id: { in: [org.id, target.id] } } });
    if (legacyIdentityId) await prisma.tenantIdentity.delete({ where: { id: legacyIdentityId } });
    await prisma.identityClaim.deleteMany({ where: { number: number + "L" } });
    await prisma.serviceProvider.deleteMany({ where: { userId: { in: [user.id, impostor.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [user.id, impostor.id] } } });
    await prisma.$disconnect();
  }
});
test("reinstatement preserves old leases, prevents double allocation and limits previous-occupant data", { skip: !databaseUrl }, async () => {
  const { prisma } = await import("../../apps/web/src/lib/prisma");
  const { reinstateTenant, previousUnitOccupants } = await import("../../apps/web/src/features/tenancy/service");
  const suffix = randomUUID();
  const org = await prisma.organization.create({ data: { name: "Returning tenant org", slug: `reinstate-${suffix}` } });
  const other = await prisma.organization.create({ data: { name: "Other org", slug: `reinstate-other-${suffix}` } });
  const user = await prisma.user.create({ data: { fullName: "Returning tenant", passwordHash: "retained-password" } });
  const newUser = await prisma.user.create({ data: { fullName: "New tenant", passwordHash: "test-only" } });
  const property = await prisma.property.create({ data: { orgId: org.id, name: "Apartment" } });
  const oldUnit = await prisma.unit.create({ data: { propertyId: property.id, houseNo: "A1", rentAmount: 10000, status: "VACANT" } });
  const nextUnit = await prisma.unit.create({ data: { propertyId: property.id, houseNo: "A2", rentAmount: 12000, status: "VACANT" } });
  const tenant = await prisma.tenant.create({ data: { orgId: org.id, userId: user.id, fullName: user.fullName, phone: "retained-phone", status: "INACTIVE", archivedAt: new Date() } });
  const incoming = await prisma.tenant.create({ data: { orgId: org.id, userId: newUser.id, fullName: newUser.fullName, phone: "incoming-phone" } });
  const oldLease = await prisma.lease.create({ data: { orgId: org.id, tenantId: tenant.id, unitId: oldUnit.id, monthlyRent: 10000, startDate: new Date("2025-01-01T00:00:00+03:00"), endDate: new Date("2026-01-01T00:00:00+03:00"), status: "TERMINATED" } });
  const input = { tenantId: tenant.id, unitId: oldUnit.id, startDate: "2026-10-14", dueDay: 5, monthlyRent: 10000, deposit: 10000 };
  try {
    await assert.rejects(reinstateTenant(other.id, user.id, input), /not found/);
    const attempts = await Promise.allSettled([reinstateTenant(org.id, user.id, input), reinstateTenant(org.id, user.id, { ...input, unitId: nextUnit.id })]);
    assert.equal(attempts.filter(attempt => attempt.status === "fulfilled").length, 1);
    assert.equal((await prisma.lease.findUniqueOrThrow({ where: { id: oldLease.id } })).status, "TERMINATED");
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).passwordHash, "retained-password");
    assert.equal((await prisma.tenant.findUniqueOrThrow({ where: { id: tenant.id } })).status, "ACTIVE");
    assert.equal((await prisma.tenant.findUniqueOrThrow({ where: { id: tenant.id } })).archivedAt, null);
    const active = await prisma.lease.findFirstOrThrow({ where: { tenantId: tenant.id, status: "ACTIVE" } });
    assert.equal(await prisma.rentCharge.count({ where: { leaseId: active.id } }), 2);
    await prisma.lease.update({ where: { id: active.id }, data: { status: "TERMINATED", endDate: new Date("2026-10-15T00:00:00+03:00") } });
    await prisma.unit.update({ where: { id: active.unitId }, data: { status: "VACANT" } });
    await reinstateTenant(org.id, user.id, { tenantId: incoming.id, unitId: oldUnit.id, startDate: "2026-10-16", dueDay: 5, monthlyRent: 10000, deposit: 0 });
    const history = await previousUnitOccupants(newUser.id, org.id);
    assert.ok(history.length >= 1);
    for (const occupant of history) { assert.deepEqual(Object.keys(occupant).sort(), ["durationDays", "name"]); assert.equal(occupant.name, user.fullName); assert.ok(occupant.durationDays >= 1); }
    assert.deepEqual(await previousUnitOccupants(newUser.id, other.id), []);
    const before = await prisma.lease.count();
    await assert.rejects(reinstateTenant(org.id, user.id, { ...input, startDate: "2026-10-16" }), /unavailable/);
    assert.equal(await prisma.lease.count(), before);
  } finally {
    await prisma.organization.deleteMany({ where: { id: { in: [org.id, other.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [user.id, newUser.id] } } });
    await prisma.$disconnect();
  }
});
