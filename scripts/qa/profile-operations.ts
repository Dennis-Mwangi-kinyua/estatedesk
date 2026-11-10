import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { configureTestDatabase } from "../../tests/integration/database-safety";

async function main() {
  if (!configureTestDatabase()) throw new Error("A disposable local TEST_DATABASE_URL is required.");
  const { prisma } = await import("../../apps/web/src/lib/prisma");
  const { getOperatingQueue } = await import("../../apps/web/src/lib/workflow/operating-queue");
  const { countUnpostedPayments } = await import("../../apps/web/src/lib/accounting/unposted-payments");
  const tag = randomUUID(), now = new Date();
  const actor = await prisma.user.create({ data: { fullName: "Synthetic performance actor", passwordHash: "not-a-login" } });
  const org = await prisma.organization.create({ data: { name: "Synthetic performance organization", slug: `ops-profile-${tag}` } });
  try {
    const property = await prisma.property.create({ data: { orgId: org.id, name: "Synthetic performance property" } });
    const count = 2000;
    for (let start = 0; start < count; start += 250) {
      const indices = Array.from({ length: Math.min(250, count - start) }, (_, i) => i + start);
      await prisma.unit.createMany({ data: indices.map(i => ({ id: `${tag}-unit-${i}`, propertyId: property.id, houseNo: `Test ${i}`, rentAmount: 10000, status: "OCCUPIED" })) });
      await prisma.tenant.createMany({ data: indices.map(i => ({ id: `${tag}-tenant-${i}`, orgId: org.id, fullName: `Fictional tenant ${i}`, phone: `test-${tag}-${i}` })) });
      await prisma.lease.createMany({ data: indices.map(i => ({ id: `${tag}-lease-${i}`, orgId: org.id, unitId: `${tag}-unit-${i}`, tenantId: `${tag}-tenant-${i}`, startDate: new Date("2026-01-01"), monthlyRent: 10000 })) });
      await prisma.rentCharge.createMany({ data: indices.flatMap(i => Array.from({ length: 6 }, (_, month) => ({ orgId: org.id, leaseId: `${tag}-lease-${i}`, period: `2026-${String(month + 1).padStart(2, "0")}`, amountDue: 10000, balance: 10000, dueDate: new Date(Date.UTC(2026, month, 5)) }))) });
      await prisma.issueTicket.createMany({ data: indices.map(i => ({ orgId: org.id, reportedByUserId: actor.id, title: `Fictional issue ${i}`, description: "Synthetic profile only", priority: "URGENT", createdAt: new Date(now.getTime() - 5 * 3600000) })) });
      await prisma.payment.createMany({ data: indices.map(i => ({ id: `${tag}-payment-${i}`, orgId: org.id, method: "CASH", targetType: "RENT", amount: 100, verificationStatus: "VERIFIED" })) });
    }
    for (const table of ["Lease", "RentCharge", "Unit", "Tenant", "IssueTicket", "Payment", "Notification"]) await prisma.$executeRawUnsafe(`ANALYZE "${table}"`);
    const reads: { model: string; operation: string; rows: number }[] = [];
    // Runtime observation avoids constructing Prisma's all-model extension type graph in tsc.
    const db = new Proxy(prisma, { get(target, model) {
      const delegate = Reflect.get(target, model);
      if (typeof delegate === "function") return async (...args: unknown[]) => {
        const result = await Reflect.apply(delegate, target, args);
        if (Array.isArray(result)) reads.push({ model: "SQL", operation: String(model), rows: result.length });
        return result;
      };
      if (!delegate || typeof delegate !== "object") return delegate;
      return new Proxy(delegate, { get(owner, operation) {
        const fn = Reflect.get(owner, operation);
        if (typeof fn !== "function") return fn;
        return async (...args: unknown[]) => {
          const result = await Reflect.apply(fn, owner, args);
          if (Array.isArray(result)) reads.push({ model: String(model), operation: String(operation), rows: result.length });
          return result;
        };
      } });
    } });
    const samples = [];
    for (let i = 0; i < 5; i++) {
      reads.length = 0;
      const started = performance.now();
      const groups = await getOperatingQueue(org.id, "KES", now, db as unknown as typeof prisma);
      samples.push({ ms: performance.now() - started, transferredRows: reads.reduce((n, v) => n + v.rows, 0), reads: [...reads], groups: groups.map(v => ({ id: v.id, total: v.total, preview: v.items.length })) });
    }
    const countStarted = performance.now();
    const backlog = await countUnpostedPayments(prisma, org.id);
    const report = { dataset: { leases: count, rentCharges: count * 6, issues: count, payments: count }, method: "Five local SQL-backed samples; fixture creation excluded; not production latency or concurrent-user capacity.", samples, unposted: { count: backlog, ms: performance.now() - countStarted } };
    await writeFile(process.env.PROFILE_OUTPUT ?? "/tmp/estatedesk-operations-profile.json", JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ samples: samples.map(v => ({ ms: Math.round(v.ms), transferredRows: v.transferredRows })), backlog }));
  } finally {
    await prisma.organization.delete({ where: { id: org.id } }); await prisma.user.delete({ where: { id: actor.id } }); await prisma.$disconnect();
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Profile failed"); process.exitCode = 1; });
