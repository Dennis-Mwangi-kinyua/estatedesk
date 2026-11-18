import assert from "node:assert/strict";
import { test } from "node:test";
import { configureTestDatabase } from "./database-safety";
const databaseUrl = configureTestDatabase();
const skip = databaseUrl ? false : "TEST_DATABASE_URL is not configured";

import { fixture, assertBalanced } from "./move-out-fixture";


test("handover applies deposit, preserves history and receipts, and refund settles the GL", { skip }, async () => {
  const f = await fixture();
  try {
    await f.close();
    assert.equal((await f.prisma.lease.findUniqueOrThrow({ where: { id: f.lease.id } })).status, "TERMINATED");
    assert.equal((await f.prisma.unit.findUniqueOrThrow({ where: { id: f.unit.id } })).status, "UNDER_MAINTENANCE");
    assert.equal((await f.prisma.tenant.findUniqueOrThrow({ where: { id: f.tenant.id } })).status, "INACTIVE");
    assert.equal(await f.prisma.tenantHistoryRecord.count({ where: { tenantId: f.tenant.id, leaseId: f.lease.id } }), 1);
    const notice = await f.prisma.moveOutNotice.findUniqueOrThrow({ where: { id: f.notice.id } });
    const settlement = notice.closeout as Record<string, unknown>;
    assert.equal(settlement.refundDue, 500); assert.equal(settlement.amountOwed, 0);
    const receipt = await f.prisma.receipt.findUniqueOrThrow({ where: { paymentId: String(settlement.depositPaymentId) } });
    assert.ok(receipt.documentId);
    const { buildPeriodInvoiceContext, loadVerifiedPeriodInvoiceByCode } = await import("../../apps/web/src/lib/documents/tenant-period-invoice");
    const invoiceInput = { orgId: f.org.id, tenantId: f.tenant.id, historicalLeaseId: f.lease.id, period: f.period };
    const archive = await buildPeriodInvoiceContext(invoiceInput);
    assert.equal(archive?.periodBill.leaseId, f.lease.id);
    assert.equal(archive?.pdfData.status, "PAID");
    assert.equal(archive?.pdfData.lines.length, 3);
    assert.ok(archive?.document.verificationCode);
    assert.equal((await loadVerifiedPeriodInvoiceByCode(archive.document.verificationCode))?.periodBill.leaseId, f.lease.id);
    assert.equal(await buildPeriodInvoiceContext({ ...invoiceInput, period: "1990-01" }), null);
    assert.equal(await buildPeriodInvoiceContext({ ...invoiceInput, historicalLeaseId: "different-lease" }), null);
    assert.equal(Number((await f.prisma.waterBill.findUniqueOrThrow({ where: { id: f.water.id } })).amountPaid), 1000);
    await f.refund();
    await assert.rejects(f.refund(), /no pending deposit refund/);
    const deposits = await f.prisma.accountingJournalLine.findMany({ where: { orgId: f.org.id, account: { systemKey: "TENANT_DEPOSITS" } } });
    assert.equal(deposits.reduce((sum, l) => sum + Number(l.credit) - Number(l.debit), 0), 0);
    await assertBalanced(f.prisma, f.org.id);
    assert.equal(await f.prisma.receipt.count({ where: { id: receipt.id } }), 1);
  } finally { await f.cleanup(); }
});

test("post-handover debt payment clears ledger without new recurring billing", { skip }, async () => {
  const f = await fixture(8000);
  try {
    await f.approveArrears();
    await f.close();
    const before = await f.prisma.rentCharge.count({ where: { leaseId: f.lease.id } });
    const payment = await f.prisma.payment.create({ data: { orgId: f.org.id, payerTenantId: f.tenant.id, method: "CASH", amount: 3500, targetType: "COMBINED", gatewayStatus: "PENDING", verificationStatus: "PENDING", callbackRaw: { combined: true, leaseId: f.lease.id, period: f.period } } });
    const session = { userId: f.actor.id, activeOrgId: f.org.id, activeOrgRole: "MANAGER" as const, email: null, fullName: "Manager", platformRole: "USER" as const, mustChangePassword: false, requiresTermsAcceptance: false, membershipScope: null };
    await f.prisma.$transaction(tx => f.verifyPayment(tx, session, payment.id, "Cash receipt verified"), { isolationLevel: "Serializable", timeout: 15000 });
    assert.equal(await f.prisma.rentCharge.count({ where: { leaseId: f.lease.id } }), before);
    assert.equal(await f.prisma.rentCharge.count({ where: { leaseId: f.lease.id, balance: { gt: 0 } } }), 0);
    assert.ok(await f.prisma.receipt.findUnique({ where: { paymentId: payment.id } }));
    await assertBalanced(f.prisma, f.org.id);
  } finally { await f.cleanup(); }
});

test("simultaneous closeouts and refunds each create one settlement only", { skip }, async () => {
  const f = await fixture();
  try {
    const closes = await Promise.allSettled([f.close(), f.close()]);
    assert.equal(closes.filter(r => r.status === "fulfilled").length, 1);
    assert.equal(await f.prisma.payment.count({ where: { orgId: f.org.id, method: "DEPOSIT_OFFSET" } }), 1);
    const refunds = await Promise.allSettled([f.refund(), f.refund()]);
    assert.equal(refunds.filter(r => r.status === "fulfilled").length, 1);
    assert.equal(await f.prisma.auditLog.count({ where: { orgId: f.org.id, action: "MOVE_OUT_REFUND_RECORDED" } }), 1);
    await assertBalanced(f.prisma, f.org.id);
  } finally { await f.cleanup(); }
});

test("stale reports, incomplete water approval and incorrect deposits block handover", { skip }, async () => {
  const f = await fixture();
  try {
    f.form.set("depositHeld", "13000"); await assert.rejects(f.close(), /deposit ledger/);
    f.form.set("depositHeld", "12000");
    await f.prisma.waterBill.update({ where: { id: f.water.id }, data: { status: "PENDING_APPROVAL" } });
    await assert.rejects(f.close());
    await f.prisma.waterBill.update({ where: { id: f.water.id }, data: { status: "ISSUED" } });
    f.form.set("costItems", JSON.stringify([{ description: "Changed repair", amount: 700 }]));
    await assert.rejects(f.close(), /Settlement has changed/);
    assert.equal((await f.prisma.lease.findUniqueOrThrow({ where: { id: f.lease.id } })).status, "ACTIVE");
  } finally { await f.cleanup(); }
});

test("move-out preserves tenant activity when another lease remains active", { skip }, async () => {
  const f = await fixture();
  try {
    const property = await f.prisma.unit.findUniqueOrThrow({ where: { id: f.unit.id } });
    const otherUnit = await f.prisma.unit.create({ data: { propertyId: property.propertyId, houseNo: "A2", rentAmount: 5000, status: "OCCUPIED" } });
    await f.prisma.lease.create({ data: { orgId: f.org.id, tenantId: f.tenant.id, unitId: otherUnit.id, monthlyRent: 5000, startDate: new Date() } });
    await f.close();
    const tenant = await f.prisma.tenant.findUniqueOrThrow({ where: { id: f.tenant.id } });
    assert.equal(tenant.status, "ACTIVE"); assert.equal(tenant.archivedAt, null);
    assert.equal((await f.prisma.unit.findUniqueOrThrow({ where: { id: otherUnit.id } })).status, "OCCUPIED");
  } finally { await f.cleanup(); }
});

test("payment racing handover cannot double-apply deposit or lose a payment", { skip }, async () => {
  const f = await fixture(8000);
  try {
    await f.approveArrears();
    const payment = await f.prisma.payment.create({ data: { orgId: f.org.id, payerTenantId: f.tenant.id, method: "CASH", amount: 1000, targetType: "COMBINED", gatewayStatus: "SUCCESS", verificationStatus: "NOT_REQUIRED", callbackRaw: { combined: true, leaseId: f.lease.id, period: f.period } } });
    const session = { userId: f.actor.id, activeOrgId: f.org.id, activeOrgRole: "MANAGER" as const, email: null, fullName: "Manager", platformRole: "USER" as const, mustChangePassword: false, requiresTermsAcceptance: false, membershipScope: null };
    const pay = () => f.prisma.$transaction(tx => f.verifyPayment(tx, session, payment.id, "Receipt verified"), { isolationLevel: "Serializable", timeout: 15000 });
    const results = await Promise.allSettled([f.close(), pay()]);
    if (results[1].status === "rejected") await pay();
    const closed = (await f.prisma.moveOutNotice.findUniqueOrThrow({ where: { id: f.notice.id } })).status === "CLOSED";
    const { loadMoveOutBalances } = await import("../../apps/web/src/lib/move-outs/balances");
    assert.equal((await loadMoveOutBalances(f.prisma, f.lease)).totalCents, closed ? 250000 : 1000000);
    assert.equal(await f.prisma.payment.count({ where: { orgId: f.org.id, method: "DEPOSIT_OFFSET" } }), closed ? 1 : 0);
    assert.equal((await f.prisma.payment.findUniqueOrThrow({ where: { id: payment.id } })).verificationStatus, "VERIFIED");
    await assertBalanced(f.prisma, f.org.id);
  } finally { await f.cleanup(); }
});


test("arrears handover requires approval and preserves debt after admin approval", { skip }, async () => {
  const f = await fixture(8000);
  try {
    await assert.rejects(f.close(), /must approve/);
    assert.equal((await f.prisma.lease.findUniqueOrThrow({ where: { id: f.lease.id } })).status, "ACTIVE");
    assert.equal((await f.prisma.unit.findUniqueOrThrow({ where: { id: f.unit.id } })).status, "OCCUPIED");
    await f.approveArrears();
    await f.close();
    const notice = await f.prisma.moveOutNotice.findUniqueOrThrow({ where: { id: f.notice.id } });
    assert.equal(notice.status, "CLOSED");
    assert.equal((notice.closeout as Record<string, unknown>).amountOwed, 3500);
    const { loadMoveOutBalances } = await import("../../apps/web/src/lib/move-outs/balances");
    assert.equal((await loadMoveOutBalances(f.prisma, f.lease)).totalCents, 350000);
    await assertBalanced(f.prisma, f.org.id);
  } finally { await f.cleanup(); }
});

test("invoice history batches monthly billing queries without changing balances", { skip }, async () => {
  const f = await fixture();
  const [{ PrismaClient }, { PrismaPg }, { addMonthsToPeriod }, billing] = await Promise.all([
    import("@prisma/client"),
    import("@prisma/adapter-pg"),
    import("../../apps/web/src/lib/ledger-utils"),
    import("../../apps/web/src/lib/billing/period-bill"),
  ]);
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl! }),
    log: [{ emit: "event", level: "query" }],
  });
  let queries = 0;
  db.$on("query", () => { queries += 1; });
  try {
    const periods = Array.from({ length: 12 }, (_, index) => addMonthsToPeriod(f.period, -index));
    const input = { db, orgId: f.org.id, tenantId: f.tenant.id, showPendingWater: true };
    const summarize = (bill: Awaited<ReturnType<typeof billing.getPeriodBillForTenant>>) => ({
      amountDue: bill?.amountDue, amountPaid: bill?.amountPaid, balance: bill?.balance,
      lines: bill?.lines.map(({ kind, label, balance }) => ({ kind, label, balance })),
    });
    const single = [];
    for (const period of periods) {
      single.push(summarize(await billing.getPeriodBillForTenant({ ...input, period })));
    }
    const individualQueries = queries;
    queries = 0;
    const batch = await billing.getPeriodBillsForTenant({ ...input, periods });
    assert.deepEqual([...batch.values()].map(summarize), single);
    assert.ok(queries * 6 <= individualQueries, `Batch used ${queries} queries vs ${individualQueries} individually`);
    console.log(`12-period invoice fixture used ${queries} database queries vs ${individualQueries} individually.`);
  } finally {
    await db.$disconnect();
    await f.cleanup();
  }
});

test("platform ledger aggregates rent and recognized water payments in the database", { skip }, async () => {
  const f = await fixture();
  try {
    const { getPlatformPaymentLedger } = await import("../../apps/web/src/lib/ledger");
    const paidAt = new Date(`${f.period}-15T12:00:00Z`);
    await f.prisma.payment.createMany({
      data: [
        { orgId: f.org.id, payerTenantId: f.tenant.id, waterBillId: f.water.id, method: "CASH", targetType: "WATER", amount: 30.25, gatewayStatus: "SUCCESS", verificationStatus: "VERIFIED", paidAt, createdAt: paidAt },
        { orgId: f.org.id, payerTenantId: f.tenant.id, waterBillId: f.water.id, method: "BANK", targetType: "WATER", amount: 50, gatewayStatus: "PENDING", verificationStatus: "PENDING", createdAt: paidAt },
      ],
    });
    const ledger = await getPlatformPaymentLedger(f.period, { q: f.org.slug });
    assert.equal(ledger.rows.length, 1);
    assert.equal(ledger.rows[0].expected, 11000);
    assert.equal(ledger.rows[0].paid, 30.25);
    assert.equal(ledger.rows[0].deficit, 10969.75);
    assert.equal(ledger.rows[0].paymentCount, 2);
    assert.equal(ledger.rows[0].lastPaymentAt?.getTime(), paidAt.getTime());
  } finally {
    await f.cleanup();
  }
});
