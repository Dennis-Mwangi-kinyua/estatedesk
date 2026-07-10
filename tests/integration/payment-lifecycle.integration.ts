import assert from "node:assert/strict";
import test from "node:test";

const databaseUrl = process.env.TEST_DATABASE_URL;

test(
  "manual payment: submit, reject duplicate, verify, allocate, and issue receipt",
  { skip: databaseUrl ? false : "TEST_DATABASE_URL is not configured" },
  async () => {
    process.env.DATABASE_URL = databaseUrl;
    process.env.DIRECT_URL = databaseUrl;
    const [{ prisma }, { allocateRentPayment }] = await Promise.all([
      import("../../apps/web/src/lib/prisma"),
      import("../../apps/web/src/lib/ledger"),
    ]);
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const org = await prisma.organization.create({
      data: { name: `Payment Test ${suffix}`, slug: `payment-test-${suffix}` },
    });

    try {
      const property = await prisma.property.create({
        data: { orgId: org.id, name: `Property ${suffix}` },
      });
      const unit = await prisma.unit.create({
        data: { propertyId: property.id, houseNo: "A1", rentAmount: 15_000 },
      });
      const tenant = await prisma.tenant.create({
        data: { orgId: org.id, fullName: "Lifecycle Tenant", phone: `2547${Date.now().toString().slice(-8)}` },
      });
      const lease = await prisma.lease.create({
        data: {
          orgId: org.id,
          unitId: unit.id,
          tenantId: tenant.id,
          startDate: new Date("2026-06-01"),
          monthlyRent: 15_000,
        },
      });
      const payment = await prisma.payment.create({
        data: {
          orgId: org.id,
          payerTenantId: tenant.id,
          method: "MPESA_MANUAL",
          amount: 15_000,
          targetType: "RENT",
          externalReference: "QAB12CD34E",
          transactionReferenceKey: "MPESA:QAB12CD34E",
          verificationStatus: "PENDING",
          gatewayStatus: "PENDING",
          callbackRaw: { leaseId: lease.id, months: 1, startPeriod: "2026-06" },
        },
      });

      await assert.rejects(
        prisma.payment.create({
          data: {
            orgId: org.id,
            method: "MPESA_MANUAL",
            amount: 15_000,
            targetType: "RENT",
            transactionReferenceKey: "MPESA:QAB12CD34E",
          },
        }),
        (error: unknown) =>
          typeof error === "object" && error !== null && "code" in error && error.code === "P2002",
      );

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { verificationStatus: "VERIFIED", gatewayStatus: "SUCCESS" },
        });
        await allocateRentPayment({
          db: tx,
          orgId: org.id,
          paymentId: payment.id,
          leaseId: lease.id,
          amount: 15_000,
          startPeriod: "2026-06",
        });
        await tx.receipt.create({
          data: { paymentId: payment.id, receiptNo: `TEST-${suffix}` },
        });
      });

      const completed = await prisma.payment.findUniqueOrThrow({
        where: { id: payment.id },
        include: { allocations: true, receipt: true },
      });
      assert.equal(completed.verificationStatus, "VERIFIED");
      assert.equal(completed.allocations.length, 1);
      assert.equal(Number(completed.unappliedAmount), 0);
      assert.ok(completed.receipt);
    } finally {
      await prisma.organization.delete({ where: { id: org.id } });
      await prisma.$disconnect();
    }
  },
);
