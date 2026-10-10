import assert from "node:assert/strict";
import test from "node:test";
import { configureTestDatabase } from "./database-safety";
const databaseUrl = configureTestDatabase();

test("new tenant gets first rent and deposit atomically; verified payments issue receipts and hold deposit once", { skip: !databaseUrl }, async () => {
  const [{ fixture }, { executeCreateTenantTransaction }, { createInitialLeaseCharges }, { depositHeldCents }, { Prisma }] = await Promise.all([
    import("./move-out-fixture"),
    import("../../apps/web/src/features/tenants/actions/_lib/create-tenant-transaction"),
    import("../../apps/web/src/lib/billing/initial-lease-charges"),
    import("../../apps/web/src/lib/move-outs/readiness"), import("@prisma/client"),
  ]);
  const f = await fixture();
  let newUserId: string | undefined;
  try {
    const unit = await f.prisma.unit.create({ data: { propertyId: f.unit.propertyId, houseNo: "NEW", rentAmount: 15000, depositAmount: 15000, status: "VACANT" } });
    const suffix = Date.now().toString();
    await executeCreateTenantTransaction({ orgId: f.org.id, fullName: "Initial charges tenant", phone: `2548${suffix.slice(-8)}`, email: null, nationalId: null, kraPin: null, notes: null, statusRaw: "ACTIVE", nextOfKinName: "Kin", nextOfKinRelationship: "Sibling", nextOfKinPhone: "254700000000", nextOfKinEmail: null, unitId: unit.id, leaseStartDate: new Date("2026-10-10T00:00:00Z"), dueDay: 5, monthlyRent: null, deposit: null, username: `initial${suffix}`, password: "Test-only-password-123" });
    const lease = await f.prisma.lease.findFirstOrThrow({ where: { unitId: unit.id }, include: { tenant: true } });
    newUserId = lease.tenant.userId!;
    const charges = await f.prisma.rentCharge.findMany({ where: { leaseId: lease.id }, orderBy: { chargeType: "asc" } });
    assert.equal(charges.length, 2);
    assert.deepEqual(charges.map(charge => charge.chargeType).sort(), ["DEPOSIT", "RENT"]);
    assert.equal(charges.reduce((sum, charge) => sum + Number(charge.balance), 0), 30000);
    assert.equal((await f.prisma.unit.findUniqueOrThrow({ where: { id: unit.id } })).status, "OCCUPIED");
    assert.equal(await depositHeldCents(f.prisma, lease), 0);
    const session = { userId: f.actor.id, email: f.actor.email, fullName: f.actor.fullName, platformRole: "USER" as const, activeOrgId: f.org.id, activeOrgRole: "MANAGER" as const, mustChangePassword: false, requiresTermsAcceptance: false, membershipScope: null };
    for (const charge of charges) {
      await f.prisma.$transaction(async tx => {
        const payment = await tx.payment.create({ data: { orgId: f.org.id, payerTenantId: lease.tenantId, payerUserId: newUserId, payerName: lease.tenant.fullName, method: "CASH", amount: charge.balance, rentChargeId: charge.id, targetType: charge.chargeType === "DEPOSIT" ? "DEPOSIT" : "RENT", verificationStatus: "PENDING", gatewayStatus: "PENDING" } });
        await f.verifyPayment(tx, session, payment.id, "Cash confirmed");
        await f.verifyPayment(tx, session, payment.id, "Repeated verification is harmless");
        const completed = await tx.payment.findUniqueOrThrow({ where: { id: payment.id }, include: { receipt: { include: { document: true } }, allocations: true } });
        assert.equal(completed.receipt?.document?.documentType, "RECEIPT");
        assert.equal(completed.allocations.length, 1);
        assert.equal(Number(completed.allocations[0].amount), 15000);
      }, { isolationLevel: "Serializable", timeout: 15000 });
    }
    await f.prisma.$transaction(tx => createInitialLeaseCharges(tx, lease), { timeout: 15000 });
    const final = await f.prisma.rentCharge.findMany({ where: { leaseId: lease.id } });
    assert.equal(final.length, 2);
    assert.ok(final.every(charge => charge.status === "PAID" && charge.balance.eq(new Prisma.Decimal(0))));
    assert.equal(await depositHeldCents(f.prisma, lease), 1500000);
  } finally {
    await f.cleanup();
    if (newUserId) await f.prisma.user.delete({ where: { id: newUserId } });
    await f.prisma.$disconnect();
  }
});
