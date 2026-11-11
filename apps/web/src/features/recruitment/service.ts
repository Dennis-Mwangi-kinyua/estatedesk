import { candidateMessage, stageMessageKinds } from "./communication-policy";
import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AppSession } from "@/lib/auth/session";
import { hiringOrgId, type HiringScope } from "./scope";
import { allowedStages, applicationSchema, calendarDate, check, jobSchema, validateResume, type ApplicationStage } from "./policy";

export const publicJobWhere = (now = new Date()): Prisma.RecruitmentJobWhereInput => ({ status: "OPEN", publishedAt: { not: null }, closesAt: { gt: now }, OR: [{ orgId: null }, { org: { status: "ACTIVE", deletedAt: null } }] });
const publicSelect = { id: true, slug: true, title: true, department: true, location: true, employmentType: true, workplace: true, description: true, requirements: true, salaryMin: true, salaryMax: true, salaryPeriod: true, currencyCode: true, closesAt: true, publishedAt: true, postedByName: true, org: { select: { name: true, slug: true } } } satisfies Prisma.RecruitmentJobSelect;
export async function publicJobs(query = "", location = "", employer = "", page = 1) {
  const where: Prisma.RecruitmentJobWhereInput = { ...publicJobWhere(), ...(query ? { AND: [{ OR: [{ title: { contains: query.slice(0, 100), mode: "insensitive" } }, { department: { contains: query.slice(0, 100), mode: "insensitive" } }, { org: { name: { contains: query.slice(0, 100), mode: "insensitive" } } }] }] } : {}), ...(location ? { location: { contains: location.slice(0, 100), mode: "insensitive" } } : {}), ...(employer === "platform" ? { orgId: null } : employer ? { org: { slug: employer, status: "ACTIVE", deletedAt: null } } : {}) };
  const [jobs, total] = await Promise.all([prisma.recruitmentJob.findMany({ where, select: publicSelect, skip: (page - 1) * 20, take: 20, orderBy: [{ publishedAt: "desc" }, { id: "desc" }] }), prisma.recruitmentJob.count({ where })]);
  return { jobs, total };
}
export async function publicJob(slug: string) { return prisma.recruitmentJob.findFirst({ where: { ...publicJobWhere(), slug }, select: publicSelect }); }
async function log(tx: Prisma.TransactionClient, session: AppSession, orgId: string | null, action: string, entityId: string, metadata: Prisma.InputJsonObject = {}) {
  await tx.auditLog.create({ data: { orgId, actorUserId: session.userId, action, entityType: "Recruitment", entityId, metadata } });
}
export async function saveJob(session: AppSession, scope: HiringScope, input: unknown, id = "", version = "") {
  const orgId = hiringOrgId(session, scope);
  const data = jobSchema.parse(input);
  const closesAt = new Date(`${data.closingDate}T23:59:59.999+03:00`);
  check(closesAt > new Date(), "Closing date must be today or later.");
  return prisma.$transaction(async tx => {
    if (orgId) check(await tx.organization.findFirst({ where: { id: orgId, status: "ACTIVE", deletedAt: null } }), "Organization is unavailable.");
    const values = { title: data.title, department: data.department || null, location: data.location, employmentType: data.employmentType, workplace: data.workplace, description: data.description, requirements: data.requirements, salaryMin: data.salaryMin || null, salaryMax: data.salaryMax || null, currencyCode: data.currencyCode, salaryPeriod: data.salaryPeriod, closesAt };
    if (id) {
      check(Number.isFinite(Date.parse(version)), "Refresh this job before saving.");
      const result = await tx.recruitmentJob.updateMany({ where: { id, orgId, updatedAt: new Date(version) }, data: { ...values, updatedAt: new Date(Math.max(Date.now(), Date.parse(version) + 1)) } });
      check(result.count === 1, "This job changed or is unavailable. Refresh before saving.");
    } else {
      const slug = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "job"}-${randomUUID().slice(0, 12)}`;
      const created = await tx.recruitmentJob.create({ data: { ...values, orgId, createdByUserId: session.userId, postedByName: session.fullName, slug } }); id = created.id;
    }
    await log(tx, session, orgId, "RECRUITMENT_JOB_SAVED", id);
    return id;
  }, { isolationLevel: "Serializable" });
}
export async function changeJobStatus(session: AppSession, scope: HiringScope, id: string, status: string, version: string) {
  const orgId = hiringOrgId(session, scope);
  check(["DRAFT", "OPEN", "CLOSED"].includes(status) && Number.isFinite(Date.parse(version)), "Choose a valid job status.");
  await prisma.$transaction(async tx => {
    const job = await tx.recruitmentJob.findFirst({ where: { id, orgId, updatedAt: new Date(version) } });
    check(job, "This job changed or is unavailable. Refresh before publishing.");
    if (status === "OPEN") {
      check(job.closesAt > new Date(), "Update the closing date before reopening this job.");
      if (orgId) check(await tx.organization.findFirst({ where: { id: orgId, status: "ACTIVE", deletedAt: null } }), "Organization is unavailable.");
    }
    await tx.recruitmentJob.update({ where: { id }, data: { status, publishedAt: status === "OPEN" ? job.publishedAt ?? new Date() : job.publishedAt, updatedAt: new Date(Math.max(Date.now(), job.updatedAt.getTime() + 1)) } });
    await log(tx, session, orgId, `RECRUITMENT_JOB_${status}`, id);
  }, { isolationLevel: "Serializable" });
}
export async function submitApplication(slug: string, input: unknown, resume?: { bytes: Uint8Array; fileName: string }) {
  const data = applicationSchema.parse(input);
  if (resume) validateResume(resume.bytes);
  return prisma.$transaction(async tx => {
    const job = await tx.recruitmentJob.findFirst({ where: { ...publicJobWhere(), slug }, select: { id: true, title: true, orgId: true, createdByUserId: true, org: { select: { name: true } } } });
    check(job, "This job is no longer accepting applications.");
    // A duplicate receives the same generic acknowledgement without disclosing a prior application.
    const inserted = await tx.recruitmentApplication.createMany({ data: [{ jobId: job.id, source: data.source, fullName: data.fullName, email: data.email, phone: data.phone, coverLetter: data.coverLetter, portfolioUrl: data.portfolioUrl || null, ...(resume ? { resumeBytes: new Uint8Array(resume.bytes), resumeFileName: resume.fileName.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 160), resumeSize: resume.bytes.length } : {}) }], skipDuplicates: true });
    if (inserted.count) {
      const application = await tx.recruitmentApplication.findUniqueOrThrow({ where: { jobId_email: { jobId: job.id, email: data.email } } });
      const receipt = candidateMessage({ id: application.id, fullName: application.fullName, title: job.title, employer: job.org?.name ?? "EstateDesk", kind: "RECEIPT" });
      await tx.recruitmentCommunication.create({ data: { jobId: job.id, applicationId: application.id, dedupeKey: `receipt:${application.id}`, kind: "RECEIPT", recipient: application.email, ...receipt, status: "QUEUED" } });
    }
    if (inserted.count && job.orgId) await tx.notification.create({ data: { orgId: job.orgId, userId: job.createdByUserId, channel: "IN_APP", type: "GENERAL", title: "New job application", message: `A candidate applied for ${job.title}. Review the application in Recruitment.`, status: "SENT", sentAt: new Date() } });
  }, { isolationLevel: "Serializable" });
}
export async function reviewApplication(session: AppSession, scope: HiringScope, id: string, status: string, note: string, version: string, interviewDate = "", interviewDetails = "") {
  const orgId = hiringOrgId(session, scope);
  check(note.trim().length >= 3 && note.length <= 3000 && Number.isFinite(Date.parse(version)), "Add a review note and refresh the application before saving.");
  const interviewAt = interviewDate ? new Date(`${interviewDate}:00+03:00`) : null;
  if (interviewDate) check(/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(interviewDate) && calendarDate.safeParse(interviewDate.slice(0, 10)).success, "Choose a valid interview date and time.");
  check(!interviewAt || Number.isFinite(interviewAt.getTime()), "Choose a valid interview date and time in Nairobi time.");
  if (status === "INTERVIEW") {
    check(interviewAt && interviewAt > new Date(), "Choose a future interview appointment.");
    check(interviewDetails.trim().length >= 5 && interviewDetails.length <= 1000, "Add the interview location or meeting link and a hiring contact.");
  }
  await prisma.$transaction(async tx => {
    const application = await tx.recruitmentApplication.findFirst({ where: { id, job: { orgId }, updatedAt: new Date(version) }, include: { job: { include: { org: { select: { name: true } } } } } });
    check(application, "Application changed or is unavailable. Refresh before reviewing.");
    check(status === application.status || allowedStages(application.status).includes(status as ApplicationStage), "This stage transition is unavailable.");
    const updated = await tx.recruitmentApplication.update({ where: { id }, data: { status, updatedAt: new Date(Math.max(Date.now(), application.updatedAt.getTime() + 1)) } });
    const event = await tx.recruitmentApplicationEvent.create({ data: { applicationId: id, actorUserId: session.userId, fromStatus: application.status, toStatus: status, note: note.trim(), interviewAt, interviewDetails: status === "INTERVIEW" ? interviewDetails.trim() : null } });
    await tx.recruitmentCommunication.updateMany({ where: { applicationId: id, kind: { not: "RECEIPT" }, status: { in: ["DRAFT", "QUEUED", "FAILED"] } }, data: { status: "CANCELLED", lastError: "Candidate review changed; use the latest message." } });
    const kind = stageMessageKinds[status];
    if (kind) {
      const message = candidateMessage({ id, fullName: application.fullName, title: application.job.title, employer: application.job.org?.name ?? "EstateDesk", kind, interviewAt, interviewDetails });
      await tx.recruitmentCommunication.create({ data: { jobId: application.jobId, applicationId: id, dedupeKey: `review:${event.id}`, kind, recipient: application.email, ...message, expectedVersion: updated.updatedAt, interviewEventId: kind === "INTERVIEW" ? event.id : null, interviewAt: kind === "INTERVIEW" ? interviewAt : null } });
    }
    await log(tx, session, orgId, "RECRUITMENT_APPLICATION_REVIEWED", id, { status });
  }, { isolationLevel: "Serializable" });
}
export async function deleteApplication(session: AppSession, scope: HiringScope, id: string, reason: string) {
  const orgId = hiringOrgId(session, scope);
  check((scope === "platform" || session.activeOrgRole === "ADMIN") && reason.trim().length >= 5 && reason.length <= 1000, "An administrator must provide a reason before deleting an application.");
  await prisma.$transaction(async tx => {
    const removed = await tx.recruitmentApplication.deleteMany({ where: { id, job: { orgId } } });
    check(removed.count === 1, "Application unavailable.");
    await log(tx, session, orgId, "RECRUITMENT_APPLICATION_DELETED", id, { reason });
  });
}
export async function hiringJobs(session: AppSession, scope: HiringScope, page: number, q = "", status = "ALL") {
  const orgId = hiringOrgId(session, scope);
  const now = new Date();
  const scopeWhere = { orgId };
  const statusWhere: Prisma.RecruitmentJobWhereInput = status === "EXPIRED"
    ? { status: "OPEN", closesAt: { lte: now } }
    : status === "OPEN" ? { status: "OPEN", closesAt: { gt: now } }
    : status === "DRAFT" || status === "CLOSED" ? { status } : {};
  const where: Prisma.RecruitmentJobWhereInput = { ...scopeWhere, ...statusWhere, ...(q ? { title: { contains: q.slice(0, 100), mode: "insensitive" } } : {}) };
  const [jobs, total, draftCount, openCount, applicationCount, reviewCount] = await Promise.all([
    prisma.recruitmentJob.findMany({ where, include: { _count: { select: { applications: true } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 20, skip: (page - 1) * 20 }),
    prisma.recruitmentJob.count({ where }),
    prisma.recruitmentJob.count({ where: { ...scopeWhere, status: "DRAFT" } }),
    prisma.recruitmentJob.count({ where: { ...scopeWhere, status: "OPEN", closesAt: { gt: now } } }),
    prisma.recruitmentApplication.count({ where: { job: scopeWhere } }),
    prisma.recruitmentApplication.count({ where: { job: scopeWhere, status: "SUBMITTED" } }),
  ]);
  return { jobs, total, summary: { draftCount, openCount, applicationCount, reviewCount } };
}
export async function hiringJob(session: AppSession, scope: HiringScope, id: string, page: number, status = "ALL", q = "") {
  const orgId = hiringOrgId(session, scope);
  const job = await prisma.recruitmentJob.findFirst({ where: { orgId, id }, include: { org: { select: { name: true } }, communications: { where: { applicationId: null }, orderBy: { createdAt: "desc" }, take: 20 } } });
  check(job, "Job unavailable.");
  const where: Prisma.RecruitmentApplicationWhereInput = { jobId: id, job: { orgId }, ...(status === "ALL" ? {} : { status }), ...(q ? { OR: [{ fullName: { contains: q.slice(0, 100), mode: "insensitive" } }, { email: { contains: q.slice(0, 100), mode: "insensitive" } }] } : {}) };
  const [applications, total, stages] = await Promise.all([
    prisma.recruitmentApplication.findMany({ where, select: { id: true, source: true, communications: { orderBy: { createdAt: "desc" }, take: 30 }, fullName: true, email: true, phone: true, coverLetter: true, portfolioUrl: true, resumeFileName: true, resumeSize: true, status: true, createdAt: true, updatedAt: true, events: { select: { id: true, note: true, interviewDetails: true, fromStatus: true, toStatus: true, interviewAt: true, createdAt: true, actor: { select: { fullName: true } } }, orderBy: { createdAt: "desc" }, take: 10 } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 20, skip: (page - 1) * 20 }),
    prisma.recruitmentApplication.count({ where }), prisma.recruitmentApplication.groupBy({ by: ["status"], where: { jobId: id, job: { orgId } }, _count: true }),
  ]);
  return { job, applications, total, stages };
}
export async function applicantResume(session: AppSession, scope: HiringScope, id: string) {
  const orgId = hiringOrgId(session, scope);
  const result = await prisma.recruitmentApplication.findFirst({ where: { id, job: { orgId } }, select: { resumeBytes: true, resumeFileName: true } });
  check(result?.resumeBytes, "CV unavailable."); return result;
}
