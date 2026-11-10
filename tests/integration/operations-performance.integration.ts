import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { configureTestDatabase } from "./database-safety";
const databaseUrl = configureTestDatabase();
test("bounded queue previews retain full tenant/SLA totals and dashboard backlog counts beyond 500 payments", { skip: !databaseUrl }, async () => {
  const { prisma } = await import("../../apps/web/src/lib/prisma");
  const { getOperatingQueue } = await import("../../apps/web/src/lib/workflow/operating-queue");
  const { countUnpostedPayments } = await import("../../apps/web/src/lib/accounting/unposted-payments");
  const tag = randomUUID(), now = new Date("2026-11-10T12:00:00Z");
  const org = await prisma.organization.create({ data: { name: "Operations integration", slug: `ops-test-${tag}` } });
  const actor = await prisma.user.create({ data: { fullName: "Operations test actor", passwordHash: "not-a-login" } });
  try {
    const property = await prisma.property.create({ data: { orgId: org.id, name: "Operations property" } });
    const indices = Array.from({ length: 60 }, (_, i) => i);
    await prisma.unit.createMany({ data: indices.map(i => ({ id: `${tag}-u-${i}`, propertyId: property.id, houseNo: String(i), rentAmount: 1000 })) });
    await prisma.tenant.createMany({ data: indices.map(i => ({ id: `${tag}-t-${i}`, orgId: org.id, fullName: `Tenant ${i}`, phone: `test-${i}` })) });
    await prisma.lease.createMany({ data: indices.map(i => ({ id: `${tag}-l-${i}`, orgId: org.id, unitId: `${tag}-u-${i}`, tenantId: `${tag}-t-${i}`, startDate: new Date("2026-01-01"), monthlyRent: 1000 })) });
    await prisma.rentCharge.createMany({ data: indices.flatMap(i => ["09", "10"].map(month => ({ orgId: org.id, leaseId: `${tag}-l-${i}`, period: `2026-${month}`, dueDate: new Date(`2026-${month}-05`), amountDue: 1000, balance: 1000 }))) });
    await prisma.notification.createMany({ data: indices.map(i => ({ orgId: org.id, tenantId: `${tag}-t-${i}`, channel: "IN_APP", type: "RENT_OVERDUE_REMINDER", title: "Old reminder", message: "Old", createdAt: new Date(i < 5 ? "2026-11-02" : "2026-10-02") })) });
    await prisma.issueTicket.createMany({ data: indices.map(i => ({ orgId: org.id, reportedByUserId: actor.id, title: `Issue ${i}`, description: "Test SLA", priority: i < 30 ? "URGENT" : "LOW", createdAt: new Date(now.getTime() - 5 * 3600000) })) });
    const groups = await getOperatingQueue(org.id, "KES", now);
    const arrears = groups.find(v => v.id === "arrears")!;
    assert.equal(arrears.total, 55); assert.equal(arrears.items.length, 25);
    assert.ok(arrears.items.every(v => v.actionFields?.period === "2026-09"));
    assert.equal(new Set(arrears.items.map(v => v.actionFields?.leaseId)).size, 25);
    const issues = groups.find(v => v.id === "issues")!;
    assert.equal(issues.total, 30); assert.equal(issues.items.length, 25);
    await prisma.payment.createMany({ data: Array.from({ length: 620 }, (_, i) => ({ id: `${tag}-p-${i}`, orgId: org.id, method: "CASH", targetType: "RENT", amount: 100, verificationStatus: "VERIFIED" })) });
    await prisma.accountingJournalEntry.createMany({ data: Array.from({ length: 600 }, (_, i) => ({ orgId: org.id, sourceType: "PAYMENT", sourceId: `${tag}-p-${i}`, entryNumber: `Test ${i}`, entryDate: now, description: "Synthetic posting marker" })) });
    assert.equal(await countUnpostedPayments(prisma, org.id), 20);
    assert.equal(await countUnpostedPayments(prisma, "missing-organization"), 0);
    const { loadReportsPageData } = await import("../../apps/web/src/app/(app)/dashboard/org/reports/_lib/queries");
    const first = await loadReportsPageData(org.id, { period: "2026-09" });
    const last = await loadReportsPageData(org.id, { period: "2026-09", page: "3" });
    assert.equal(first.filteredRows.length, 25); assert.equal(last.filteredRows.length, 10);
    assert.equal(first.pagination.totalRows, 60); assert.equal(last.pagination.totalRows, 60);
    assert.equal(first.scopedTotals.expected, 60000); assert.equal(last.scopedTotals.expected, 60000);
    const failed = await prisma.notification.create({ data: { orgId: org.id, userId: actor.id, channel: "EMAIL", type: "GENERAL", title: "Failed delivery", message: "Test", status: "FAILED", providerResponse: { actionUrl: "/dashboard/org/payments", error: "Old error", provider: "resend" } } });
    const { requeueFailedNotifications } = await import("../../apps/web/src/lib/notifications/retry");
    assert.equal((await requeueFailedNotifications(prisma, actor.id, failed.id)).count, 1);
    const retried = await prisma.notification.findUniqueOrThrow({ where: { id: failed.id } });
    assert.equal(retried.status, "QUEUED"); assert.equal(retried.sentAt, null);
    assert.equal((retried.providerResponse as { actionUrl: string }).actionUrl, "/dashboard/org/payments");
    assert.equal((await requeueFailedNotifications(prisma, actor.id, failed.id)).count, 0);
  } finally {
    try { await prisma.organization.delete({ where: { id: org.id } }); await prisma.user.delete({ where: { id: actor.id } }); }
    finally { await prisma.$disconnect(); }
  }
});
