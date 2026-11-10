import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { AppSession } from "../../apps/web/src/lib/auth/session";
import { configureTestDatabase } from "./database-safety";
const databaseUrl = configureTestDatabase();
test("public recruitment accepts real applications while separating platform and organization hiring data", { skip: !databaseUrl }, async t => {
  const { prisma } = await import("../../apps/web/src/lib/prisma");
  const service = await import("../../apps/web/src/features/recruitment/service");
  const tag = randomUUID();
  const admin = await prisma.user.create({ data: { fullName: "Recruitment operator", passwordHash: "test-only", platformRole: "PLATFORM_ADMIN" } });
  const owner = await prisma.user.create({ data: { fullName: "Recruitment employer", passwordHash: "test-only" } });
  const org = await prisma.organization.create({ data: { name: `Recruitment ${tag}`, slug: `recruitment-${tag}` } });
  const other = await prisma.organization.create({ data: { name: `Other hiring ${tag}`, slug: `other-hiring-${tag}` } });
  const actor = (platform: boolean, orgId = org.id): AppSession => ({ userId: platform ? admin.id : owner.id, fullName: platform ? admin.fullName : owner.fullName, email: null, platformRole: platform ? "PLATFORM_ADMIN" : "USER", activeOrgId: orgId, activeOrgRole: "ADMIN", membershipScope: { scopeType: "ORG", scopeId: orgId }, mustChangePassword: false, requiresTermsAcceptance: false });
  const platform = actor(true), employer = actor(false), foreign = actor(false, other.id);
  const draft = { title: `Property manager ${tag}`, department: "Operations", location: "Nairobi, Kenya", employmentType: "FULL_TIME", workplace: "ON_SITE", description: "Manage a growing residential property portfolio and coordinate staff.", requirements: "At least two years of relevant property management experience.", salaryMin: "40000", salaryMax: "60000", currencyCode: "KES", salaryPeriod: "MONTH", closingDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) };
  const applicant = { fullName: "Applicant Example", email: "Candidate@Example.invalid", phone: "0700000000", coverLetter: "I have experience managing residential properties and coordinating staff.", portfolioUrl: "https://example.invalid/profile", consent: "on" };
  let platformJobId = "";
  try {
    const orgJobId = await service.saveJob(employer, "organization", draft);
    platformJobId = await service.saveJob(platform, "platform", { ...draft, title: `Platform engineer ${tag}` });
    let orgJob = await prisma.recruitmentJob.findUniqueOrThrow({ where: { id: orgJobId } });
    await t.test("drafts cannot appear publicly or accept applications", async () => {
      assert.equal(await service.publicJob(orgJob.slug), null);
      await assert.rejects(service.submitApplication(orgJob.slug, applicant));
      await assert.rejects(service.changeJobStatus(foreign, "organization", orgJob.id, "OPEN", orgJob.updatedAt.toISOString()));
      await assert.rejects(service.changeJobStatus(platform, "platform", orgJob.id, "OPEN", orgJob.updatedAt.toISOString()));
    });
    await service.changeJobStatus(employer, "organization", orgJob.id, "OPEN", orgJob.updatedAt.toISOString());
    orgJob = await prisma.recruitmentJob.findUniqueOrThrow({ where: { id: orgJobId } });
    const platformJob = await prisma.recruitmentJob.findUniqueOrThrow({ where: { id: platformJobId } });
    await service.changeJobStatus(platform, "platform", platformJob.id, "OPEN", platformJob.updatedAt.toISOString());
    await t.test("public listings identify employers and posters without exposing applicant data", async () => {
      const result = await service.publicJob(orgJob.slug);
      assert.equal(result?.org?.name, org.name); assert.equal(result?.postedByName, owner.fullName);
      assert.equal("applications" in result!, false); assert.equal("createdByUserId" in result!, false);
      const list = await service.publicJobs(tag); assert.equal(list.total, 2);
      assert.equal((await service.publicJobs(tag, "", "platform")).total, 1);
      assert.equal((await service.publicJobs(tag, "", org.slug)).total, 1);
    });
    await t.test("applications persist a private PDF, normalize email and do not duplicate or overwrite submissions", async () => {
      await service.submitApplication(orgJob.slug, applicant, { bytes: new TextEncoder().encode("%PDF-1.4\nPrivate CV\n%%EOF"), fileName: "candidate.pdf" });
      await service.submitApplication(orgJob.slug, { ...applicant, fullName: "Duplicate should not overwrite" });
      const records = await prisma.recruitmentApplication.findMany({ where: { jobId: orgJob.id } });
      assert.equal(records.length, 1); assert.equal(records[0].email, "candidate@example.invalid"); assert.equal(records[0].fullName, applicant.fullName); assert.ok(records[0].resumeBytes);
      await assert.rejects(service.submitApplication(orgJob.slug, { ...applicant, email: "other@example.invalid", consent: "" }));
    });
    const application = await prisma.recruitmentApplication.findFirstOrThrow({ where: { jobId: orgJobId } });
    await t.test("CV downloads and applicant lists require the owning employer", async () => {
      const cv = await service.applicantResume(employer, "organization", application.id); assert.ok(cv.resumeBytes);
      await assert.rejects(service.applicantResume(foreign, "organization", application.id));
      await assert.rejects(service.applicantResume(platform, "platform", application.id));
      await assert.rejects(service.hiringJob(foreign, "organization", orgJob.id, 1));
      const data = await service.hiringJob(employer, "organization", orgJob.id, 1);
      assert.equal(data.total, 1); assert.equal("resumeBytes" in data.applications[0], false);
    });
    await t.test("review transitions record interview times and reject stale reviews", async () => {
      await assert.rejects(service.reviewApplication(foreign, "organization", application.id, "SCREENING", "Other employer", application.updatedAt.toISOString()));
      await assert.rejects(service.reviewApplication(employer, "organization", application.id, "HIRED", "Skip the pipeline", application.updatedAt.toISOString()));
      await service.reviewApplication(employer, "organization", application.id, "SHORTLISTED", "Relevant experience", application.updatedAt.toISOString());
      await assert.rejects(service.reviewApplication(employer, "organization", application.id, "REJECTED", "Stale review", application.updatedAt.toISOString()));
      const fresh = await prisma.recruitmentApplication.findUniqueOrThrow({ where: { id: application.id } });
      await assert.rejects(service.reviewApplication(employer, "organization", application.id, "INTERVIEW", "Arrange interview", fresh.updatedAt.toISOString()));
      const appointment = `${new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)}T10:00`;
      await service.reviewApplication(employer, "organization", application.id, "INTERVIEW", "Interview arranged separately", fresh.updatedAt.toISOString(), appointment);
      const event = await prisma.recruitmentApplicationEvent.findFirstOrThrow({ where: { applicationId: application.id, toStatus: "INTERVIEW" } });
      assert.equal(event.interviewAt?.toISOString().slice(11, 16), "07:00");
    });
    await t.test("suspended employers, expired jobs and closed jobs cannot accept new applications", async () => {
      await prisma.organization.update({ where: { id: org.id }, data: { status: "SUSPENDED" } });
      assert.equal(await service.publicJob(orgJob.slug), null);
      await assert.rejects(service.submitApplication(orgJob.slug, { ...applicant, email: "suspended@example.invalid" }));
      await prisma.organization.update({ where: { id: org.id }, data: { status: "ACTIVE" } });
      await prisma.recruitmentJob.update({ where: { id: orgJob.id }, data: { closesAt: new Date(Date.now() - 1000) } });
      await assert.rejects(service.submitApplication(orgJob.slug, { ...applicant, email: "expired@example.invalid" }));
      const job = await prisma.recruitmentJob.update({ where: { id: orgJob.id }, data: { closesAt: new Date(Date.now() + 86400000) } });
      await service.changeJobStatus(employer, "organization", job.id, "CLOSED", job.updatedAt.toISOString());
      await assert.rejects(service.submitApplication(job.slug, { ...applicant, email: "closed@example.invalid" }));
      assert.equal((await service.hiringJob(employer, "organization", job.id, 1)).total, 1);
    });
    await t.test("administrator deletion removes CV data and review history with an audit trail", async () => {
      await assert.rejects(service.deleteApplication({ ...employer, activeOrgRole: "MANAGER" }, "organization", application.id, "Retention request"));
      await service.deleteApplication(employer, "organization", application.id, "Candidate removal request");
      assert.equal(await prisma.recruitmentApplicationEvent.count({ where: { applicationId: application.id } }), 0);
      assert.equal(await prisma.recruitmentApplication.count({ where: { id: application.id } }), 0);
      assert.equal(await prisma.auditLog.count({ where: { orgId: org.id, action: "RECRUITMENT_APPLICATION_DELETED" } }), 1);
    });
  } finally {
    await prisma.recruitmentJob.deleteMany({ where: { id: platformJobId } });
    await prisma.organization.deleteMany({ where: { id: { in: [org.id, other.id] } } });
    await prisma.auditLog.deleteMany({ where: { actorUserId: admin.id } });
    await prisma.user.deleteMany({ where: { id: { in: [admin.id, owner.id] } } });
    await prisma.$disconnect();
  }
});
