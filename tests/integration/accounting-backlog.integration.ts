import assert from "node:assert/strict";
import test from "node:test";
import { configureTestDatabase } from "./database-safety";
const databaseUrl = configureTestDatabase();

test("accounting backlog counts beyond 200 and excludes only same-organization journals", { skip: !databaseUrl }, async () => {
  const [{ prisma }, { getUnpostedPaymentSummary }] = await Promise.all([import("../../apps/web/src/lib/prisma"), import("../../apps/web/src/lib/accounting/unposted-payments")]);
  const suffix = `${Date.now()}`;
  const org = await prisma.organization.create({ data: { name: "Backlog test", slug: `backlog-${suffix}` } });
  const other = await prisma.organization.create({ data: { name: "Other backlog", slug: `backlog-other-${suffix}` } });
  try {
    await prisma.payment.createMany({ data: Array.from({ length: 205 }, (_, i) => ({ id: `backlog-${suffix}-${i}`, orgId: org.id, amount: 100, method: "CASH", verificationStatus: "VERIFIED", targetType: "RENT" })) });
    await prisma.accountingJournalEntry.create({ data: { orgId: other.id, entryNumber: "OTHER-1", entryDate: new Date(), description: "Other organization", sourceType: "PAYMENT", sourceId: `backlog-${suffix}-0` } });
    const first = await getUnpostedPaymentSummary(prisma, org.id);
    assert.equal(first.count, 205);
    assert.equal(first.payments.length, 8);
    await prisma.accountingJournalEntry.create({ data: { orgId: org.id, entryNumber: "LOCAL-1", entryDate: new Date(), description: "Already accounted", sourceType: "PAYMENT", sourceId: first.payments[0].id } });
    const after = await getUnpostedPaymentSummary(prisma, org.id);
    assert.equal(after.count, 204);
    assert.equal(after.payments.length, 8);
    assert.equal(after.payments.some(p => p.id === first.payments[0].id), false);
    assert.equal((await getUnpostedPaymentSummary(prisma, other.id)).count, 0);
  } finally {
    await prisma.organization.deleteMany({ where: { id: { in: [org.id, other.id] } } });
    await prisma.$disconnect();
  }
});
