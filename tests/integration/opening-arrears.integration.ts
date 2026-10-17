import assert from "node:assert/strict";
import test from "node:test";
import { configureTestDatabase } from "./database-safety";
const databaseUrl = configureTestDatabase();

test("existing-lease arrears remain exact through bills, ledger, accounting and payment", { skip: !databaseUrl }, async () => {
  const [{ fixture }, { executeCreateTenantTransaction }, { openingArrearsPeriods }, { getPeriodBillForTenant }, { getOrgLedger }] = await Promise.all([
    import("./move-out-fixture"),
    import("../../apps/web/src/features/tenants/actions/_lib/create-tenant-transaction"),
    import("../../apps/web/src/lib/tenants/opening-arrears"),
    import("../../apps/web/src/lib/billing/period-bill"),
    import("../../apps/web/src/lib/ledger"),
  ]);
  const f = await fixture();
  let newUserId: string | null = null;
  try {
    await f.prisma.accountingSettings.update({ where: { orgId: f.org.id }, data: { recognitionMode: "ACCRUAL", autoPostBilling: true } });
    const unit = await f.prisma.unit.create({ data: { propertyId: f.unit.propertyId, houseNo: "IMPORTED", rentAmount: 15000, depositAmount: 15000, serviceCharge: 500, garbageFee: 200, securityFee: 300, status: "VACANT" } });
    const [period] = openingArrearsPeriods();
    const suffix = Date.now().toString();
    await executeCreateTenantTransaction({ orgId: f.org.id, fullName: "Imported balance tenant", phone: `2548${suffix.slice(-8)}`, email: null, nationalId: null, kraPin: null, notes: null, statusRaw: "ACTIVE", nextOfKinName: "Kin", nextOfKinRelationship: "Sibling", nextOfKinPhone: "254700000000", nextOfKinEmail: null, unitId: unit.id, leaseStartDate: new Date(`${period}-01T00:00:00Z`), dueDay: 5, monthlyRent: null, deposit: null, username: `imported${suffix}`, password: "Test-only-password-123", existingLease: true, openingArrears: [{ period, amount: "1250.25" }], actorUserId: f.actor.id });
    const lease = await f.prisma.lease.findFirstOrThrow({ where: { unitId: unit.id }, include: { tenant: true } });
    newUserId = lease.tenant.userId;
    const charges = await f.prisma.rentCharge.findMany({ where: { leaseId: lease.id } });
    assert.equal(charges.length, 1); assert.equal(charges[0].chargeType, "OTHER");
    assert.equal(charges[0].balance.toFixed(2), "1250.25");
    const bill = await getPeriodBillForTenant({ db: f.prisma, orgId: f.org.id, tenantId: lease.tenantId, period, showPendingWater: false });
    assert.equal(bill?.amountDue, 1250.25); assert.equal(bill?.lines.length, 1);
    const ledger = await getOrgLedger(f.org.id, undefined, { tenantId: lease.tenantId });
    assert.equal(ledger.rows[0].balance, 1250.25);
    const journal = await f.prisma.accountingJournalEntry.findFirstOrThrow({ where: { orgId: f.org.id, sourceType: "OPENING_BALANCE", sourceId: charges[0].id }, include: { lines: { include: { account: true } } } });
    assert.equal(journal.lines.find(line => line.account.systemKey === "OPENING_EQUITY")?.credit.toFixed(2), "1250.25");
    assert.ok(journal.lines.every(line => line.account.type !== "INCOME"));
    const session = { userId: f.actor.id, email: f.actor.email, fullName: f.actor.fullName, platformRole: "USER" as const, activeOrgId: f.org.id, activeOrgRole: "MANAGER" as const, mustChangePassword: false, requiresTermsAcceptance: false, membershipScope: null };
    await f.prisma.$transaction(async tx => {
      const payment = await tx.payment.create({ data: { orgId: f.org.id, payerTenantId: lease.tenantId, payerUserId: newUserId, payerName: lease.tenant.fullName, method: "CASH", amount: 250, rentChargeId: charges[0].id, targetType: "RENT", verificationStatus: "PENDING", gatewayStatus: "PENDING" } });
      await f.verifyPayment(tx, session, payment.id, "Imported arrears partial payment");
    }, { isolationLevel: "Serializable", timeout: 15000 });
    assert.equal((await f.prisma.rentCharge.findUniqueOrThrow({ where: { id: charges[0].id } })).balance.toFixed(2), "1000.25");
    assert.equal((await getOrgLedger(f.org.id, undefined, { tenantId: lease.tenantId })).rows[0].balance, 1000.25);
    assert.equal(await f.prisma.rentCharge.count({ where: { leaseId: lease.id } }), 1);
  } finally {
    await f.cleanup();
    if (newUserId) await f.prisma.user.delete({ where: { id: newUserId } });
    await f.prisma.$disconnect();
  }
});
