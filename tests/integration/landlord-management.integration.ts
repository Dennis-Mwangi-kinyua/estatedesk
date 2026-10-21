import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { configureTestDatabase } from "./database-safety";
const databaseUrl = configureTestDatabase();

test("landlord provisioning and mapping keep property access inside the organization", { skip: !databaseUrl }, async () => {
  const { prisma } = await import("../../apps/web/src/lib/prisma");
  const { createLandlordAccount, mapLandlordProperties } = await import("../../apps/web/src/features/landlords/service");
  const { getLandlordDashboardData } = await import("../../apps/web/src/app/(app)/dashboard/landlord/_lib/queries");
  const suffix = randomUUID();
  const org = await prisma.organization.create({ data: { name: "Landlord management test", slug: `landlords-${suffix}`, currencyCode: "USD" } });
  const other = await prisma.organization.create({ data: { name: "Other landlord organization", slug: `landlords-other-${suffix}` } });
  const actor = await prisma.user.create({ data: { fullName: "Landlord test administrator", passwordHash: "test-only" } });
  const propertyA = await prisma.property.create({ data: { orgId: org.id, name: "Property A" } });
  const propertyB = await prisma.property.create({ data: { orgId: org.id, name: "Property B" } });
  const foreignProperty = await prisma.property.create({ data: { orgId: other.id, name: "Foreign property" } });
  const unitA = await prisma.unit.create({ data: { propertyId: propertyA.id, houseNo: "A1", rentAmount: 1500 } });
  await prisma.unit.create({ data: { propertyId: propertyA.id, houseNo: "A2", rentAmount: 2000 } });
  let createdUserId: string | undefined;
  const username = `owner.${suffix.slice(0, 12)}`;
  const input = { fullName: "Jane Owner", username, email: "", phone: "", propertyIds: [propertyA.id, propertyA.id] };
  try {
    const result = await createLandlordAccount(org.id, actor.id, input);
    assert.match(result.setupUrl, /reset-password\?token=[a-f0-9]{64}/);
    assert.ok(!("password" in result));
    const profile = await prisma.landlordProfile.findUniqueOrThrow({ where: { id: result.profileId } });
    createdUserId = profile.userId;
    const membership = await prisma.membership.findFirstOrThrow({ where: { orgId: org.id, userId: createdUserId } });
    assert.equal(membership.role, "LANDLORD");
    assert.equal(await prisma.landlordAssignment.count({ where: { landlordProfileId: profile.id, propertyId: propertyA.id, active: true } }), 1);
    const initial = await getLandlordDashboardData(org.id, createdUserId);
    assert.deepEqual(initial?.properties.map(property => property.id), [propertyA.id]);
    assert.equal(initial?.currencyCode, "USD");
    assert.equal(await getLandlordDashboardData(other.id, createdUserId), null);
    await assert.rejects(mapLandlordProperties(org.id, actor.id, profile.id, [foreignProperty.id]), /belonging to this organization/);
    await assert.rejects(mapLandlordProperties(other.id, actor.id, profile.id, [foreignProperty.id]), /not found/);
    await assert.rejects(createLandlordAccount(org.id, actor.id, { ...input, username: `${username}.x`, propertyIds: [foreignProperty.id] }), /belonging to this organization/);
    assert.equal(await prisma.user.count({ where: { username: `${username}.x` } }), 0);
    await Promise.all([mapLandlordProperties(org.id, actor.id, profile.id, [propertyB.id]), mapLandlordProperties(org.id, actor.id, profile.id, [propertyB.id])]);
    assert.equal(await prisma.landlordAssignment.count({ where: { landlordProfileId: profile.id, propertyId: propertyB.id, active: true } }), 1);
    const previous = await prisma.landlordAssignment.findFirstOrThrow({ where: { landlordProfileId: profile.id, propertyId: propertyA.id } });
    assert.equal(previous.active, false);
    assert.ok(previous.endedAt);
    assert.deepEqual((await getLandlordDashboardData(org.id, createdUserId))?.properties.map(property => property.id), [propertyB.id]);
    await prisma.landlordAssignment.create({ data: { orgId: org.id, landlordProfileId: profile.id, propertyId: propertyA.id, unitId: unitA.id } });
    await mapLandlordProperties(org.id, actor.id, profile.id, []);
    const limited = await getLandlordDashboardData(org.id, createdUserId);
    assert.deepEqual(limited?.properties.map(property => property.id), [propertyA.id]);
    assert.deepEqual(limited?.units.map(unit => unit.id), [unitA.id]);
    assert.equal(await prisma.auditLog.count({ where: { entityId: profile.id, action: "LANDLORD_PROPERTIES_UPDATED" } }), 4);
  } finally {
    if (createdUserId) await prisma.passwordResetToken.deleteMany({ where: { userId: createdUserId } });
    await prisma.organization.deleteMany({ where: { id: { in: [org.id, other.id] } } });
    if (createdUserId) await prisma.user.deleteMany({ where: { id: createdUserId } });
    await prisma.user.deleteMany({ where: { id: actor.id } });
    await prisma.$disconnect();
  }
});
