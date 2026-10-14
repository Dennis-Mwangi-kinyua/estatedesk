import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { configureTestDatabase } from "./database-safety";
const databaseUrl = configureTestDatabase();
test("provider hiring, completion, reports and moderation remain scoped and race-safe", { skip: !databaseUrl }, async () => {
  const { prisma } = await import("../../apps/web/src/lib/prisma");
  const { hireProvider, applyForJob, confirmAndReview, reportProvider, visibleProviderWhere } = await import("../../apps/web/src/features/providers/service");
  const suffix = randomUUID();
  const first = await prisma.organization.create({ data: { name: "Hiring org", slug: `hire-${suffix}` } });
  const second = await prisma.organization.create({ data: { name: "Other org", slug: `other-hire-${suffix}` } });
  const user = await prisma.user.create({ data: { fullName: "Provider", passwordHash: "test-only" } });
  const otherUser = await prisma.user.create({ data: { fullName: "Other provider", passwordHash: "test-only" } });
  const profile = { businessName: "Plumbing services", category: "Plumbing", location: "Nairobi", bio: "Residential plumbing repairs and installations" };
  const provider = await prisma.serviceProvider.create({ data: { userId: user.id, ...profile } });
  const otherProvider = await prisma.serviceProvider.create({ data: { userId: otherUser.id, ...profile } });
  const jobData = { orgId: first.id, title: "Repair tap", description: "Replace leaking tap in kitchen", category: "Plumbing", location: "Nairobi" };
  try {
    const job = await prisma.serviceJob.create({ data: jobData });
    await applyForJob(provider.id, job.id, "Available tomorrow morning.");
    await applyForJob(provider.id, job.id, "Available this afternoon.");
    assert.equal(await prisma.jobApplication.count({ where: { jobId: job.id, providerId: provider.id } }), 1);
    await assert.rejects(hireProvider(second.id, job.id, provider.id), /organisation/);
    const hires = await Promise.allSettled([hireProvider(first.id, job.id, provider.id), hireProvider(first.id, job.id, otherProvider.id)]);
    assert.equal(hires.filter(result => result.status === "fulfilled").length, 1);
    await assert.rejects(confirmAndReview(first.id, job.id, { rating: 5, comment: "Excellent work" }), /submitted/);
    await assert.rejects(reportProvider(second.id, job.id, "Work was not completed as agreed."), /organisation/);
    const hired = await prisma.serviceJob.findUniqueOrThrow({ where: { id: job.id } });
    await prisma.serviceJob.update({ where: { id: job.id }, data: { status: "SUBMITTED", completionNotes: "Tap replaced and tested" } });
    await assert.rejects(confirmAndReview(second.id, job.id, { rating: 5, comment: "Excellent work" }), /organisation/);
    const confirmations = await Promise.allSettled([confirmAndReview(first.id, job.id, { rating: 5, comment: "Excellent work" }), confirmAndReview(first.id, job.id, { rating: 4, comment: "Good job" })]);
    assert.equal(confirmations.filter(result => result.status === "fulfilled").length, 1);
    assert.equal(await prisma.providerReview.count({ where: { jobId: job.id, providerId: hired.providerId! } }), 1);
    const report = await reportProvider(first.id, job.id, "Follow-up work was not completed as agreed.");
    assert.equal(report.providerId, hired.providerId);
    await reportProvider(first.id, job.id, "Updated report with more supporting details.");
    assert.equal(await prisma.providerReport.count({ where: { jobId: job.id } }), 1);
    const another = await prisma.serviceJob.create({ data: { ...jobData, orgId: second.id } });
    await hireProvider(second.id, another.id, provider.id);
    for (const status of ["FLAGGED", "SUSPENDED", "DELETED"] as const) {
      await prisma.serviceProvider.update({ where: { id: provider.id }, data: { status } });
      const open = await prisma.serviceJob.create({ data: jobData });
      await assert.rejects(hireProvider(first.id, open.id, provider.id), /not available/);
      await assert.rejects(applyForJob(provider.id, open.id, "I can do this work tomorrow"), /not available/);
      assert.equal(await prisma.serviceProvider.count({ where: { id: provider.id, ...visibleProviderWhere } }), 0);
    }
    assert.equal(await prisma.providerReview.count({ where: { jobId: job.id } }), 1);
  } finally {
    await prisma.organization.deleteMany({ where: { id: { in: [first.id, second.id] } } });
    await prisma.serviceProvider.deleteMany({ where: { id: { in: [provider.id, otherProvider.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [user.id, otherUser.id] } } });
    await prisma.$disconnect();
  }
});
