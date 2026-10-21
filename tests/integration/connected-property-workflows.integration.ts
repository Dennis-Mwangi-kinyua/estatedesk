import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { configureTestDatabase } from "./database-safety";
const databaseUrl = configureTestDatabase();
async function fixture() {
  const { prisma } = await import("../../apps/web/src/lib/prisma");
  const suffix = randomUUID();
  const org = await prisma.organization.create({ data: { name: "Connected workflow test", slug: `connected-${suffix}` } });
  const other = await prisma.organization.create({ data: { name: "Other organization", slug: `other-${suffix}` } });
  const user = await prisma.user.create({ data: { fullName: "Tenant", passwordHash: "test-only", email: `${suffix}@example.test` } });
  const property = await prisma.property.create({ data: { orgId: org.id, name: "Apartment" } });
  const unit = await prisma.unit.create({ data: { propertyId: property.id, houseNo: "A1", rentAmount: 10000, status: "OCCUPIED" } });
  const tenant = await prisma.tenant.create({ data: { orgId: org.id, userId: user.id, fullName: "Tenant", phone: "+254700000001" } });
  const lease = await prisma.lease.create({ data: { orgId: org.id, unitId: unit.id, tenantId: tenant.id, startDate: new Date(), monthlyRent: 10000 } });
  const listing = await prisma.bnbListing.create({ data: { orgId: org.id, propertyId: property.id, slug: `stay-${suffix}`, title: "Test stay", description: "A test apartment", location: "Nairobi", nightlyRate: 3000, contactName: "Host", contactPhone: "+254700000002" } });
  async function cleanup() { await prisma.organization.deleteMany({ where: { id: { in: [org.id, other.id] } } }); await prisma.user.delete({ where: { id: user.id } }); await prisma.$disconnect(); }
  return { prisma, org, other, user, property, tenant, lease, listing, cleanup };
}
const future = (days: number) => new Date(Date.now() + days * 86400000).toISOString();
test("concurrent overlapping bookings allow only one writer; other organizations cannot extend", { skip: !databaseUrl }, async () => {
  const f = await fixture();
  const { saveReservation: saveScopedReservation } = await import("../../apps/web/src/features/bnb/reservation-service");
  const saveReservation = (...args: Parameters<typeof saveScopedReservation>) => saveScopedReservation(args[0], args[1], args[2], args[3], { scopeType: "ORG", scopeId: "ORG_SCOPE" });
  try {
    const input = { guestName: "Guest", guestPhone: "", checkIn: future(1), checkOut: future(3) };
    await assert.rejects(saveScopedReservation(f.org.id, f.listing.id, input), /Listing not found/);
    await assert.rejects(saveScopedReservation(f.org.id, f.listing.id, input, undefined, { scopeType: "PROPERTY", scopeId: "unassigned-property" }), /Listing not found/);
    const results = await Promise.allSettled([saveReservation(f.org.id, f.listing.id, input), saveReservation(f.org.id, f.listing.id, input)]);
    assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
    assert.equal(await f.prisma.bnbReservation.count({ where: { listingId: f.listing.id } }), 1);
    const saved = await f.prisma.bnbReservation.findFirstOrThrow({ where: { listingId: f.listing.id } });
    await assert.rejects(saveReservation(f.other.id, f.listing.id, { ...input, checkOut: future(4) }, saved.id), /not found/);
  } finally { await f.cleanup(); }
});
test("an extension cannot overwrite the next booking; a valid extension updates availability", { skip: !databaseUrl }, async () => {
  const f = await fixture();
  const { saveReservation: saveScopedReservation } = await import("../../apps/web/src/features/bnb/reservation-service");
  const saveReservation = (...args: Parameters<typeof saveScopedReservation>) => saveScopedReservation(args[0], args[1], args[2], args[3], { scopeType: "ORG", scopeId: "ORG_SCOPE" });
  try {
    const first = { guestName: "First guest", guestPhone: "", checkIn: future(1), checkOut: future(3) };
    const saved = await saveReservation(f.org.id, f.listing.id, first);
    await saveReservation(f.org.id, f.listing.id, { ...first, guestName: "Next guest", checkIn: future(5), checkOut: future(7) });
    await assert.rejects(saveReservation(f.org.id, f.listing.id, { ...first, checkOut: future(6) }, saved.id), /overlap/);
    assert.equal((await f.prisma.bnbReservation.findUniqueOrThrow({ where: { id: saved.id } })).checkOut.toISOString(), first.checkOut);
    const extended = await saveReservation(f.org.id, f.listing.id, { ...first, checkOut: future(4) }, saved.id);
    assert.ok(extended.checkOut > saved.checkOut);
  } finally { await f.cleanup(); }
});
test("gate admission is single-use, property assigned and organization isolated", { skip: !databaseUrl }, async () => {
  const f = await fixture();
  const { admitVisitor } = await import("../../apps/web/src/features/visitors/admission");
  try {
    const pass = await f.prisma.visitorPass.create({ data: { orgId: f.org.id, tenantUserId: f.user.id, leaseId: f.lease.id, propertyId: f.property.id, visitorName: "Expected visitor", tokenHash: "a".repeat(64), validFrom: new Date(Date.now()-60000), validUntil: new Date(Date.now()+3600000) } });
    const input = { orgId: f.org.id, userId: f.user.id, manager: false, passId: pass.id };
    assert.equal(await admitVisitor(input), false);
    await f.prisma.gateAssignment.create({ data: { orgId: f.org.id, userId: f.user.id, propertyId: f.property.id } });
    assert.equal(await admitVisitor({ ...input, orgId: f.other.id, manager: true }), false);
    const outcomes = await Promise.all([admitVisitor(input), admitVisitor(input)]);
    assert.deepEqual(outcomes.sort(), [false,true]);
    const revoked = await f.prisma.visitorPass.create({ data: { ...pass, id: undefined, tokenHash: "b".repeat(64), admittedAt: null, revokedAt: new Date() } });
    assert.equal(await admitVisitor({ ...input, passId: revoked.id }), false);
    await f.prisma.lease.update({ where: { id: f.lease.id }, data: { status: "TERMINATED" } });
    const expiredLease = await f.prisma.visitorPass.create({ data: { ...pass, id: undefined, tokenHash: "c".repeat(64), admittedAt: null } });
    assert.equal(await admitVisitor({ ...input, passId: expiredLease.id }), false);
  } finally { await f.cleanup(); }
});
test("official notices reach current tenants and guests once and exclude another property or ended stay", { skip: !databaseUrl }, async () => {
  const f = await fixture();
  const { publishCommunityNotice } = await import("../../apps/web/src/features/community/service");
  try {
    const guest = await f.prisma.bnbReservation.create({ data: { listingId: f.listing.id, guestName: "Current guest", checkIn: new Date(Date.now()-86400000), checkOut: new Date(Date.now()+86400000) } });
    await f.prisma.bnbReservation.create({ data: { listingId: f.listing.id, guestName: "Ended guest", checkIn: new Date(Date.now()-3*86400000), checkOut: new Date(Date.now()-86400000) } });
    const result = await publishCommunityNotice(f.org.id, f.user.id, { propertyId: f.property.id, title: "Water maintenance", message: "The water supply will be interrupted between 10am and noon." });
    assert.equal(result.recipients, 2);
    assert.equal(await f.prisma.communityNoticeRecipient.count({ where: { noticeId: result.id, tenantId: f.tenant.id } }), 1);
    assert.equal(await f.prisma.communityNoticeRecipient.count({ where: { noticeId: result.id, reservationId: guest.id } }), 1);
    assert.equal(await f.prisma.notification.count({ where: { orgId: f.org.id, tenantId: f.tenant.id, channel: "IN_APP", status: "SENT" } }), 1);
    await assert.rejects(publishCommunityNotice(f.other.id, f.user.id, { propertyId: f.property.id, title: "Wrong org", message: "This must never be published here." }), /not found/);
    assert.equal(await f.prisma.communityNotice.count({ where: { orgId: f.other.id } }), 0);
  } finally { await f.cleanup(); }
});
