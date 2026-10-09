import assert from "node:assert/strict";
export async function fixture(deposit = 12000) {
  const [{ prisma }, { ensureAccountingFoundation, postJournalEntry }, { postRentChargeAccrual, postWaterBillAccrual }, { closeMoveOut }, { recordMoveOutRefund }, { verifyPayment }, { nairobiDate, parseMoveOutDate }, { createEstateDeskReference }] = await Promise.all([
    import("../../apps/web/src/lib/prisma"), import("../../apps/web/src/lib/accounting/engine"), import("../../apps/web/src/lib/accounting/billing"), import("../../apps/web/src/lib/move-outs/closeout"), import("../../apps/web/src/lib/move-outs/refund"), import("../../apps/web/src/app/(app)/dashboard/org/payments/_lib/verify-payment"), import("../../apps/web/src/lib/move-outs/validation"), import("../../apps/web/src/lib/estatedesk-reference"),
  ]);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const day = nairobiDate(); const date = parseMoveOutDate(day); const period = day.slice(0, 7);
  const org = await prisma.organization.create({ data: { name: `Moveout lifecycle ${suffix}`, slug: `moveout-lifecycle-${suffix}` } });
  const actor = await prisma.user.create({ data: { fullName: "Moveout manager", passwordHash: "not-a-login-password", email: `moveout-${suffix}@example.test`, termsAcceptedAt: new Date() } });
  const property = await prisma.property.create({ data: { orgId: org.id, name: "Moveout property", waterRatePerUnit: 10, waterFixedCharge: 0 } });
  const unit = await prisma.unit.create({ data: { propertyId: property.id, houseNo: "A1", status: "OCCUPIED", rentAmount: 10000 } });
  const tenant = await prisma.tenant.create({ data: { orgId: org.id, fullName: "Moveout tenant", phone: `2547${Date.now().toString().slice(-8)}` } });
  const lease = await prisma.lease.create({ data: { orgId: org.id, tenantId: tenant.id, unitId: unit.id, monthlyRent: 10000, deposit, startDate: new Date(date.getTime() - 60 * 86400000) } });
  const notice = await prisma.moveOutNotice.create({ data: { referenceCode: createEstateDeskReference(), tenantId: tenant.id, leaseId: lease.id, moveOutDate: date, status: "INSPECTION_COMPLETED", inspection: { create: { referenceCode: createEstateDeskReference(), scheduledAt: date, completedAt: new Date(), inspectorUserId: actor.id, status: "COMPLETED", checklist: { meterReadingsTaken: true }, notes: "Damage inspected" } } } });
  await ensureAccountingFoundation(prisma, org.id);
  const dimensions = { tenantId: tenant.id, unitId: unit.id };
  await postJournalEntry({ db: prisma, orgId: org.id, entryDate: date, sourceType: "ADJUSTMENT", sourceId: `deposit-${notice.id}`, description: "Opening deposit actually received", userId: actor.id, lines: [{ systemKey: "BANK", debit: deposit, ...dimensions }, { systemKey: "TENANT_DEPOSITS", credit: deposit, ...dimensions }] });
  const rent = await prisma.rentCharge.create({ data: { orgId: org.id, leaseId: lease.id, period, chargeType: "RENT", amountDue: 10000, amountPaid: 0, balance: 10000, dueDate: date } });
  await postRentChargeAccrual(prisma, rent.id);
  const water = await prisma.waterBill.create({ data: { orgId: org.id, unitId: unit.id, tenantId: tenant.id, period, unitsUsed: 100, ratePerUnit: 10, total: 1000, balance: 1000, dueDate: date, status: "ISSUED" } });
  await postWaterBillAccrual(prisma, water.id);
  await prisma.meterReading.create({ data: { unitId: unit.id, period, prevReading: 10, currentReading: 110, unitsUsed: 100, status: "APPROVED", submittedByUserId: actor.id, approvedByUserId: actor.id, approvedAt: new Date() } });
  const items = [{ description: "Door repair", amount: 500 }];
  await prisma.auditLog.create({ data: { orgId: org.id, actorUserId: actor.id, action: "MOVE_OUT_REPORT_GENERATED", entityType: "MoveOutNotice", entityId: notice.id, metadata: { outstandingBills: 11000, depositHeld: deposit, itemisedCosts: items } } });
  const form = new FormData();
  for (const [key, value] of Object.entries({ actualMoveOutDate: day, depositHeld: String(deposit), expectedOutstandingBills: "11000", costItems: JSON.stringify(items), refundStatus: deposit > 11500 ? "PENDING" : "NOT_DUE", notes: "Final bills reviewed, door repair agreed and keys returned.", keysReturned: "on", balancesReviewed: "on", finalBillingConfirmed: "on", reportReviewed: "on" })) form.set(key, value);
  const input = { noticeId: notice.id, orgId: org.id, actorUserId: actor.id, form };
  const close = () => prisma.$transaction(tx => closeMoveOut(tx, input), { isolationLevel: "Serializable", timeout: 15000 });
  const proof = await prisma.asset.create({ data: { orgId: org.id, unitId: unit.id, uploadedByUserId: actor.id, fileName: "refund.png", fileType: "image", mimeType: "image/png", key: "private/refund.png", size: 100, metadata: { purpose: "refund_proof" } } });
  const refund = (reference = `REFUND-${notice.id}`) => prisma.$transaction(tx => recordMoveOutRefund(tx, { ...input, reference, method: "BANK", proofAssetId: proof.id }), { isolationLevel: "Serializable", timeout: 15000 });
  const cleanup = async () => { await prisma.accountingJournalLine.deleteMany({ where: { orgId: org.id } }); await prisma.organization.delete({ where: { id: org.id } }); await prisma.user.delete({ where: { id: actor.id } }); await prisma.$disconnect(); };
  return { prisma, org, actor, unit, tenant, lease, notice, rent, water, form, close, refund, cleanup, verifyPayment, period };
}

export async function assertBalanced(db: Awaited<ReturnType<typeof fixture>>["prisma"], orgId: string) {
  const entries = await db.accountingJournalEntry.findMany({ where: { orgId, status: "POSTED" }, include: { lines: true } });
  for (const entry of entries) assert.equal(entry.lines.reduce((sum, l) => sum + Math.round(Number(l.debit) * 100) - Math.round(Number(l.credit) * 100), 0), 0, entry.description);
}
