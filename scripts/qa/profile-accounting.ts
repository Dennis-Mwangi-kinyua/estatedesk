import { writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { configureTestDatabase } from "../../tests/integration/database-safety";

async function main() {
  if (!configureTestDatabase()) throw new Error("TEST_DATABASE_URL required");
  const [{ prisma }, { getUnpostedPaymentSummary }] = await Promise.all([import("../../apps/web/src/lib/prisma"), import("../../apps/web/src/lib/accounting/unposted-payments")]);
  const suffix = Date.now().toString();
  const org = await prisma.organization.create({ data: { name: "Disposable query profile", slug: `query-profile-${suffix}` } });
  try {
    for (let offset = 0; offset < 10000; offset += 1000) {
      await prisma.payment.createMany({ data: Array.from({ length: 1000 }, (_, i) => ({ id: `profile-${suffix}-${offset + i}`, orgId: org.id, amount: 100, method: "CASH", verificationStatus: "VERIFIED", targetType: "RENT" })) });
      if (offset < 9000) await prisma.accountingJournalEntry.createMany({ data: Array.from({ length: 1000 }, (_, i) => ({ orgId: org.id, sourceType: "PAYMENT", sourceId: `profile-${suffix}-${offset + i}`, entryNumber: `P-${offset + i}`, entryDate: new Date(), description: "Synthetic posted-payment marker" })) });
    }
    await prisma.$executeRaw`ANALYZE "Payment"`;
    await prisma.$executeRaw`ANALYZE "AccountingJournalEntry"`;
    const samples = [];
    for (let i = 0; i < 5; i++) {
      const started = performance.now();
      const result = await getUnpostedPaymentSummary(prisma, org.id);
      samples.push({ durationMs: performance.now() - started, backlogCount: result.count, transferredPaymentRows: result.payments.length });
    }
    const plans = await prisma.$queryRaw`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT p."id", COUNT(*) OVER() FROM "Payment" p
      WHERE p."orgId" = ${org.id} AND p."verificationStatus" IN ('VERIFIED', 'NOT_REQUIRED')
      AND NOT EXISTS (SELECT 1 FROM "AccountingJournalEntry" j WHERE j."orgId"=p."orgId" AND j."sourceType"='PAYMENT' AND j."sourceId"=p."id")
      ORDER BY p."createdAt" DESC,p."id" DESC LIMIT 8`;
    await writeFile(process.env.PROFILE_OUTPUT ?? "/tmp/estatedesk-accounting-profile.json", JSON.stringify({ syntheticPayments: 10000, syntheticJournals: 9000, samples, plans }, null, 2));
    console.log("Accounting query profile recorded; synthetic organization removed.");
  } finally { await prisma.organization.delete({ where: { id: org.id } }); await prisma.$disconnect(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
