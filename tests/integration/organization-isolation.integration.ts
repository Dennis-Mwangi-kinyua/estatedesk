import assert from "node:assert/strict";
import test from "node:test";
import { configureTestDatabase } from "./database-safety";
const databaseUrl = configureTestDatabase();

test("another organisation cannot verify a payment or close a tenancy by guessing its ID", { skip: !databaseUrl }, async () => {
  const [{ fixture }, { closeMoveOut }] = await Promise.all([
    import("./move-out-fixture"), import("../../apps/web/src/lib/move-outs/closeout"),
  ]);
  const f = await fixture();
  const other = await f.prisma.organization.create({ data: { name: "Isolation test", slug: `isolation-${Date.now()}` } });
  try {
    const payment = await f.prisma.payment.create({ data: { orgId: f.org.id, method: "CASH", amount: 1000, targetType: "RENT", rentChargeId: f.rent.id, verificationStatus: "PENDING", gatewayStatus: "PENDING" } });
    const session = { userId: f.actor.id, email: null, fullName: "Manager", platformRole: "USER" as const, activeOrgId: other.id, activeOrgRole: "MANAGER" as const, mustChangePassword: false, requiresTermsAcceptance: false, membershipScope: null };
    await assert.rejects(f.prisma.$transaction(tx => f.verifyPayment(tx, session, payment.id, "Cross-org attempt")), /not found/i);
    await assert.rejects(f.prisma.$transaction(tx => closeMoveOut(tx, { noticeId: f.notice.id, orgId: other.id, actorUserId: f.actor.id, form: f.form })), /completed inspection is required/i);
    const unchanged = await f.prisma.payment.findUniqueOrThrow({ where: { id: payment.id }, include: { receipt: true } });
    assert.equal(unchanged.verificationStatus, "PENDING");
    assert.equal(unchanged.receipt, null);
    assert.equal((await f.prisma.moveOutNotice.findUniqueOrThrow({ where: { id: f.notice.id } })).status, "INSPECTION_COMPLETED");
  } finally {
    await f.prisma.organization.delete({ where: { id: other.id } });
    await f.cleanup();
  }
});
