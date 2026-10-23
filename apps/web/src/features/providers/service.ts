import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notifyInAppAndPush } from "@/lib/notifications/notify";
import { reviewSchema } from "./policy";

const publicProvider = { status: "ACTIVE" as const, user: { status: "ACTIVE" as const, deletedAt: null } };
export const visibleProviderWhere = publicProvider;

async function organizationRecipients(tx: Prisma.TransactionClient, orgId: string) {
  return tx.membership.findMany({
    where: { orgId, role: { in: ["ADMIN", "MANAGER", "OFFICE"] } },
    select: { userId: true },
  });
}

export async function applyForJob(providerId: string, jobId: string, message: string) {
  return prisma.$transaction(async tx => {
    const available = await tx.serviceProvider.updateMany({
      where: { id: providerId, ...publicProvider, available: true, jobs: { none: { status: { in: ["ASSIGNED", "IN_PROGRESS", "SUBMITTED"] } } } },
      data: { updatedAt: new Date() },
    });
    if (!available.count) throw new Error("This provider is not available for new work while an assignment is active.");
    const provider = await tx.serviceProvider.findUniqueOrThrow({ where: { id: providerId }, select: { id: true, userId: true, businessName: true } });
    // Serialize application writes with hiring and cancellation on the job row.
    const open = await tx.serviceJob.updateMany({ where: { id: jobId, status: "OPEN", org: { status: "ACTIVE", deletedAt: null } }, data: { updatedAt: new Date() } });
    if (!open.count) throw new Error("This job is no longer open.");
    const job = await tx.serviceJob.findFirst({ where: { id: jobId, status: "OPEN", org: { status: "ACTIVE", deletedAt: null } }, select: { id: true, orgId: true, title: true } });
    if (!job) throw new Error("This job is no longer open.");
    const application = await tx.jobApplication.upsert({
      where: { jobId_providerId: { jobId, providerId } },
      create: { jobId, providerId, message, status: "PENDING", reviewNote: null },
      update: { message, status: "PENDING", reviewNote: null, updatedAt: new Date() },
    });
    const recipients = await organizationRecipients(tx, job.orgId);
    await notifyInAppAndPush({
      db: tx, orgId: job.orgId, recipients, actorUserId: provider.userId,
      type: "GENERAL", title: "New service provider application",
      message: `${provider.businessName} applied for “${job.title}”. Review the application in Service providers & jobs.`,
      actionUrl: "/dashboard/org/service-providers", eventKey: `provider-application:${application.id}:${application.updatedAt.toISOString()}`,
    });
    return application;
  });
}

export async function reviewJobApplication(orgId: string, actorUserId: string, applicationId: string, status: "REVIEWING" | "DECLINED", reviewNote: string) {
  return prisma.$transaction(async tx => {
    const application = await tx.jobApplication.findFirst({
      where: { id: applicationId, job: { orgId, status: "OPEN" }, status: { in: ["PENDING", "REVIEWING"] } },
      include: { provider: { select: { userId: true, businessName: true } }, job: { select: { orgId: true, title: true } } },
    });
    if (!application) throw new Error("This application is no longer available for review.");
    const updatedAt = new Date();
    const updated = await tx.jobApplication.updateMany({
      where: { id: applicationId, status: { in: ["PENDING", "REVIEWING"] } },
      data: { status, reviewNote: reviewNote || null, updatedAt },
    });
    if (updated.count !== 1) throw new Error("Application status changed. Refresh and try again.");
    await notifyInAppAndPush({
      db: tx, orgId, actorUserId, recipients: [{ userId: application.provider.userId }],
      type: "GENERAL", title: status === "REVIEWING" ? "Your application is being reviewed" : "Application update",
      message: status === "REVIEWING"
        ? `The organisation is reviewing your application for “${application.job.title}”.${reviewNote ? ` Note: ${reviewNote}` : ""}`
        : `The organisation has declined your application for “${application.job.title}”.${reviewNote ? ` Feedback: ${reviewNote}` : ""}`,
      actionUrl: "/provider", providerResponse: { source: "service-provider-marketplace", applicationId: application.id, jobId: application.jobId }, eventKey: `provider-application-review:${application.id}:${status}:${updatedAt.toISOString()}`,
    });
    return application;
  });
}

export async function withdrawJobApplication(providerId: string, userId: string, applicationId: string) {
  return prisma.$transaction(async tx => {
    const application = await tx.jobApplication.findFirst({
      where: { id: applicationId, providerId, status: { in: ["PENDING", "REVIEWING"] }, job: { status: "OPEN" } },
      include: { job: { select: { id: true, orgId: true, title: true } }, provider: { select: { businessName: true } } },
    });
    if (!application) throw new Error("This application can no longer be withdrawn.");
    const updatedAt = new Date();
    const changed = await tx.jobApplication.updateMany({ where: { id: applicationId, providerId, status: { in: ["PENDING", "REVIEWING"] } }, data: { status: "WITHDRAWN", updatedAt } });
    if (!changed.count) throw new Error("Application status changed. Refresh and try again.");
    const recipients = await organizationRecipients(tx, application.job.orgId);
    await notifyInAppAndPush({ db: tx, orgId: application.job.orgId, recipients, actorUserId: userId, type: "GENERAL", title: "Provider withdrew an application", message: `${application.provider.businessName} withdrew their application for “${application.job.title}”.`, actionUrl: "/dashboard/org/service-providers", eventKey: `provider-application-withdrawn:${applicationId}:${updatedAt.toISOString()}` });
  });
}

export async function hireProvider(orgId: string, jobId: string, providerId: string, actorUserId?: string) {
  return prisma.$transaction(async tx => {
    const available = await tx.serviceProvider.updateMany({
      where: { id: providerId, ...publicProvider, available: true, jobs: { none: { status: { in: ["ASSIGNED", "IN_PROGRESS", "SUBMITTED"] } } } },
      data: { updatedAt: new Date() },
    });
    if (!available.count) throw new Error("This provider is not available for hire while an assignment is active.");
    const provider = await tx.serviceProvider.findUniqueOrThrow({ where: { id: providerId }, select: { id: true, userId: true, businessName: true } });
    const hired = await tx.serviceJob.updateMany({ where: { id: jobId, orgId, status: "OPEN" }, data: { providerId, status: "ASSIGNED" } });
    if (!hired.count) throw new Error("Job not found in your organisation, or it has already been assigned.");
    const job = await tx.serviceJob.findUniqueOrThrow({ where: { id: jobId }, select: { title: true, updatedAt: true } });
    const otherApplicants = await tx.jobApplication.findMany({ where: { jobId, status: { in: ["PENDING", "REVIEWING"] }, providerId: { not: providerId } }, select: { providerId: true, provider: { select: { userId: true } } } });
    await tx.jobApplication.updateMany({ where: { jobId, status: { in: ["PENDING", "REVIEWING"] }, providerId: { not: providerId } }, data: { status: "DECLINED", reviewNote: "Another provider was selected for this job.", updatedAt: new Date() } });
    await tx.jobApplication.upsert({
      where: { jobId_providerId: { jobId, providerId } },
      create: { jobId, providerId, message: "Direct offer from the organisation.", status: "SELECTED" },
      update: { status: "SELECTED", reviewNote: "The organisation selected you for this job.", updatedAt: new Date() },
    });
    await notifyInAppAndPush({
      db: tx, orgId, actorUserId, recipients: [{ userId: provider.userId }], type: "GENERAL",
      title: "You received a job offer", message: `${provider.businessName} has been selected for “${job.title}”. Sign in to review and respond.`,
      actionUrl: "/provider", providerResponse: { source: "service-provider-marketplace", jobId }, eventKey: `provider-job-offer:${jobId}:${providerId}:${job.updatedAt.toISOString()}`,
    });
    for (const applicant of otherApplicants) await notifyInAppAndPush({
      db: tx, orgId, actorUserId, recipients: [{ userId: applicant.provider.userId }], type: "GENERAL",
      title: "Job application closed", message: `The organisation selected another provider for “${job.title}”.`,
      actionUrl: "/provider", providerResponse: { source: "service-provider-marketplace", jobId }, eventKey: `provider-job-closed:${jobId}:${applicant.provider.userId}:${job.updatedAt.toISOString()}`,
    });
    return { provider, job };
  });
}

export async function declineProviderJob(providerId: string, userId: string, jobId: string) {
  return prisma.$transaction(async tx => {
    // Match the provider -> job lock order used by hiring and applications.
    const provider = await tx.serviceProvider.updateMany({ where: { id: providerId, userId, status: { in: ["ACTIVE", "FLAGGED"] } }, data: { updatedAt: new Date() } });
    if (!provider.count) throw new Error("This provider cannot respond to offers.");
    const changed = await tx.serviceJob.updateMany({ where: { id: jobId, providerId, status: "ASSIGNED", payments: { none: {} } }, data: { providerId: null, status: "OPEN" } });
    if (!changed.count) throw new Error("This offer has changed or has payment records. Ask the organisation to resolve any payments before cancelling it.");
    const job = await tx.serviceJob.findUniqueOrThrow({ where: { id: jobId }, select: { orgId: true, title: true, updatedAt: true } });
    await tx.jobApplication.updateMany({ where: { jobId, providerId, status: "SELECTED" }, data: { status: "WITHDRAWN", reviewNote: "The provider declined the offer." } });
    const recipients = await organizationRecipients(tx, job.orgId);
    await notifyInAppAndPush({ db: tx, orgId: job.orgId, recipients, actorUserId: userId, type: "GENERAL", title: "Provider declined a job offer", message: `The provider declined “${job.title}”. The job is open for hiring again.`, actionUrl: "/dashboard/org/service-providers", eventKey: `provider-job-declined:${jobId}:${providerId}:${job.updatedAt.toISOString()}` });
  });
}

export async function updateProviderJob(providerId: string, userId: string, jobId: string, operation: "accept" | "submit", completionNotes?: string) {
  return prisma.$transaction(async tx => {
    const job = await tx.serviceJob.findFirst({ where: { id: jobId, providerId, provider: { status: { in: ["ACTIVE", "FLAGGED"] } }, status: operation === "accept" ? "ASSIGNED" : "IN_PROGRESS" }, select: { id: true, orgId: true, title: true } });
    if (!job) throw new Error("This job is not assigned to you or its status has changed.");
    const changed = await tx.serviceJob.updateMany({
      where: { id: jobId, providerId, status: operation === "accept" ? "ASSIGNED" : "IN_PROGRESS" },
      data: operation === "accept" ? { status: "IN_PROGRESS" } : { status: "SUBMITTED", completionNotes },
    });
    if (changed.count !== 1) throw new Error("Job status changed. Refresh and try again.");
    const recipients = await organizationRecipients(tx, job.orgId);
    await notifyInAppAndPush({
      db: tx, orgId: job.orgId, recipients, actorUserId: userId, type: "GENERAL",
      title: operation === "accept" ? "Provider accepted a job" : "Work submitted for review",
      message: operation === "accept" ? `The provider accepted “${job.title}” and started work.` : `The provider submitted “${job.title}” for your review.`,
      actionUrl: "/dashboard/org/service-providers", eventKey: `provider-job:${jobId}:${operation}`,
    });
    return job;
  });
}

export async function confirmAndReview(orgId: string, jobId: string, input: { rating: number; comment: string }, actorUserId?: string) {
  const data = reviewSchema.parse(input);
  return prisma.$transaction(async tx => {
    const changed = await tx.serviceJob.updateMany({ where: { id: jobId, orgId, status: "SUBMITTED", providerId: { not: null } }, data: { status: "COMPLETED", completedAt: new Date() } });
    if (!changed.count) throw new Error("Only submitted work in your organisation can be confirmed and rated.");
    const job = await tx.serviceJob.findUniqueOrThrow({ where: { id: jobId }, select: { providerId: true, title: true } });
    const review = await tx.providerReview.create({ data: { jobId, providerId: job.providerId!, ...data } });
    const provider = await tx.serviceProvider.findUniqueOrThrow({ where: { id: job.providerId! }, select: { userId: true } });
    await notifyInAppAndPush({ db: tx, orgId, actorUserId, recipients: [{ userId: provider.userId }], type: "GENERAL", title: "Work approved and reviewed", message: `The organisation confirmed “${job.title}” and left you a ${data.rating}/5 review.`, actionUrl: "/provider", providerResponse: { source: "service-provider-marketplace", jobId }, eventKey: `provider-job-completed:${jobId}` });
    return review;
  });
}

export async function reportProvider(orgId: string, jobId: string, reason: string) {
  const job = await prisma.serviceJob.findFirst({ where: { id: jobId, orgId, providerId: { not: null } } });
  if (!job) throw new Error("Only providers hired by your organisation can be reported.");
  return prisma.providerReport.upsert({ where: { orgId_jobId: { orgId, jobId } }, create: { orgId, jobId, providerId: job.providerId!, reason }, update: { reason, resolvedAt: null, resolvedByUserId: null, resolution: null } });
}
