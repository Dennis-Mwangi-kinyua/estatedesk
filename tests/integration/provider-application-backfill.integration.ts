import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { configureTestDatabase } from "./database-safety";

const databaseUrl = configureTestDatabase();
test("application backfill reconciles closed jobs and preserves explicit decisions", { skip: !databaseUrl }, async () => {
  const { prisma } = await import("../../apps/web/src/lib/prisma");
  const org = await prisma.organization.create({ data: { name: "Backfill test", slug: `backfill-${randomUUID()}` } });
  const user = await prisma.user.create({ data: { fullName: "Backfill provider", passwordHash: "test-only" } });
  const provider = await prisma.serviceProvider.create({ data: { userId: user.id, businessName: "Repairs", category: "Plumbing", location: "Nairobi", bio: "Residential repairs" } });
  try {
    const cases = [
      { jobStatus: "OPEN", selected: false, before: "PENDING", expected: "PENDING" },
      { jobStatus: "ASSIGNED", selected: true, before: "PENDING", expected: "SELECTED" },
      { jobStatus: "COMPLETED", selected: false, before: "PENDING", expected: "DECLINED" },
      { jobStatus: "CANCELLED", selected: true, before: "PENDING", expected: "CANCELLED" },
      { jobStatus: "COMPLETED", selected: false, before: "WITHDRAWN", expected: "WITHDRAWN" },
      { jobStatus: "COMPLETED", selected: false, before: "DECLINED", expected: "DECLINED" },
    ] as const;
    const applications: { id: string }[] = [];
    for (const item of cases) {
      const job = await prisma.serviceJob.create({ data: { orgId: org.id, title: "Repair", description: "Repair work", category: "Plumbing", location: "Nairobi", status: item.jobStatus, providerId: item.selected ? provider.id : null } });
      applications.push(await prisma.jobApplication.create({ data: { jobId: job.id, providerId: provider.id, message: "Available", status: item.before, reviewNote: "Existing feedback" } }));
    }
    const sql = await readFile("prisma/migrations/20261022130000_backfill_provider_application_statuses/migration.sql", "utf8");
    await prisma.$executeRawUnsafe(sql);
    for (const [index, item] of cases.entries()) {
      const application = await prisma.jobApplication.findUniqueOrThrow({ where: { id: applications[index].id } });
      assert.equal(application.status, item.expected);
      if (item.before !== "PENDING") assert.equal(application.reviewNote, "Existing feedback");
    }
  } finally {
    await prisma.organization.delete({ where: { id: org.id } });
    await prisma.serviceProvider.delete({ where: { id: provider.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
});
