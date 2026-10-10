import assert from "node:assert/strict";
import test from "node:test";
import { configureTestDatabase } from "./database-safety";
const databaseUrl = configureTestDatabase();

test("gateway callbacks settle partial and excess payments once; credit pays later bills without changing receipts", { skip: !databaseUrl }, async () => {
  const [{ fixture, assertBalanced }, { settleMpesaCallback }, { applyTenantCredit }, { addMonthsToPeriod }] = await Promise.all([
    import("./move-out-fixture"), import("../../apps/web/src/lib/mpesa/settle-callback"), import("../../apps/web/src/lib/payments/tenant-credit"), import("../../apps/web/src/lib/ledger-utils"),
  ]);
  const f = await fixture();
  try {
    const make = async (amount: number, suffix: string, balanceBefore: number) => {
      const payment = await f.prisma.payment.create({ data: { orgId: f.org.id, payerTenantId: f.tenant.id, payerUserId: f.actor.id, method: "MPESA_STK", amount, targetType: "COMBINED", rentChargeId: f.rent.id, waterBillId: f.water.id, checkoutRequestId: `checkout-${suffix}-${f.org.id}`, merchantRequestId: `merchant-${suffix}`, gatewayStatus: "PENDING", verificationStatus: "NOT_REQUIRED", callbackRaw: { source: "period_bill", leaseId: f.lease.id, period: f.period, balanceBefore } } });
      const callback = { CheckoutRequestID: payment.checkoutRequestId!, MerchantRequestID: payment.merchantRequestId!, ResultCode: 0, CallbackMetadata: { Item: [{ Name: "Amount", Value: amount }, { Name: "MpesaReceiptNumber", Value: `receipt-${suffix}-${f.org.id}` }] } };
      const settle = () => f.prisma.$transaction(tx => settleMpesaCallback(tx, f.org.id, callback), { isolationLevel: "Serializable", timeout: 30000 });
      return { payment, callback, settle };
    };
    const partial = await make(7000, "partial", 11000);
    await assert.rejects(f.prisma.$transaction(tx => settleMpesaCallback(tx, "another-org", partial.callback)));
    await assert.rejects(f.prisma.$transaction(tx => settleMpesaCallback(tx, f.org.id, { ...partial.callback, CallbackMetadata: { Item: [{ Name: "Amount", Value: 999 }, { Name: "MpesaReceiptNumber", Value: "wrong-amount" }] } })));
    assert.equal((await f.prisma.rentCharge.findUniqueOrThrow({ where: { id: f.rent.id } })).balance.toNumber(), 10000);
    await partial.settle();
    await partial.settle();
    assert.equal((await f.prisma.rentCharge.findUniqueOrThrow({ where: { id: f.rent.id } })).balance.toNumber(), 4000);
    assert.equal((await f.prisma.waterBill.findUniqueOrThrow({ where: { id: f.water.id } })).balance.toNumber(), 0);
    const receipt = await f.prisma.receipt.findUniqueOrThrow({ where: { paymentId: partial.payment.id }, include: { document: true } });
    assert.equal((receipt.document!.metadata as any).receiptSnapshot.remainingBalance, 4000);
    const excess = await make(9000, "excess", 4000);
    await excess.settle();
    const excessReceipt = await f.prisma.receipt.findUniqueOrThrow({ where: { paymentId: excess.payment.id }, include: { document: true } });
    const originalSnapshot = JSON.stringify(excessReceipt.document!.metadata);
    assert.equal((excessReceipt.document!.metadata as any).receiptSnapshot.creditCarriedForward, 5000);
    assert.equal((await f.prisma.payment.findUniqueOrThrow({ where: { id: excess.payment.id } })).unappliedAmount.toNumber(), 5000);
    const next = addMonthsToPeriod(f.period, 1);
    const futureWater = await f.prisma.waterBill.create({ data: { orgId: f.org.id, tenantId: f.tenant.id, unitId: f.unit.id, period: next, total: 1000, amountPaid: 0, balance: 1000, status: "ISSUED", dueDate: new Date(`${next}-01T00:00:00Z`), unitsUsed: 100, ratePerUnit: 10, fixedCharge: 0 } });
    const applied = await f.prisma.$transaction(tx => applyTenantCredit(tx, f.org.id, f.tenant.id, next), { isolationLevel: "Serializable", timeout: 30000 });
    assert.equal(applied.toNumber(), 5000);
    assert.equal((await f.prisma.rentCharge.findUniqueOrThrow({ where: { leaseId_period_chargeType: { leaseId: f.lease.id, period: next, chargeType: "RENT" } } })).balance.toNumber(), 6000);
    assert.equal((await f.prisma.waterBill.findUniqueOrThrow({ where: { id: futureWater.id } })).balance.toNumber(), 0);
    assert.equal((await f.prisma.$transaction(tx => applyTenantCredit(tx, f.org.id, f.tenant.id, next))).toNumber(), 0);
    await excess.settle();
    await f.prisma.$transaction(tx => settleMpesaCallback(tx, f.org.id, { ...excess.callback, ResultCode: 1032 }));
    assert.equal((await f.prisma.payment.findUniqueOrThrow({ where: { id: excess.payment.id } })).unappliedAmount.toNumber(), 0);
    assert.equal(JSON.stringify((await f.prisma.documentRecord.findUniqueOrThrow({ where: { id: excessReceipt.document!.id } })).metadata), originalSnapshot);
    assert.equal(await f.prisma.receipt.count({ where: { paymentId: excess.payment.id } }), 1);
    await assertBalanced(f.prisma, f.org.id);
  } finally { await f.cleanup(); }
});
