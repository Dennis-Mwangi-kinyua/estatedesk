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
