"use server";
import bcrypt from "bcryptjs";
import { nationalIdSchema, isDuplicateIdentityError, DUPLICATE_ID_MESSAGE } from "@/features/identity/policy";
import { headers } from "next/headers";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth/session";
import { requireOrgRole, requirePlatformRole } from "@/lib/permissions/guards";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireProvider } from "./access";
import { profileSchema, portfolioSchema, jobSchema, reviewSchema } from "./policy";
import { applyForJob, reviewJobApplication, withdrawJobApplication, hireProvider, declineProviderJob, updateProviderJob as updateProviderJobService, confirmAndReview, reportProvider } from "./service";
import { notifyInAppAndPush } from "@/lib/notifications/notify";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import crypto from "node:crypto";
import { hashOpaqueToken } from "@/lib/crypto/tokens";
import { getSiteUrl } from "@/lib/seo";
import { formSubmissionToken, submissionIdentity, transactionalSubmission } from "@/lib/workflow/submissions";
export type ProviderActionState = { error?: string; message?: string };
async function perform(work: () => Promise<void>, successMessage = "Saved successfully."): Promise<ProviderActionState> {
  try {
    await work();
    for (const path of ["/provider", "/service-providers", "/dashboard/org/service-providers", "/platform/service-providers"]) revalidatePath(path, "layout");
    return { message: successMessage };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (isDuplicateIdentityError(error)) return { error: DUPLICATE_ID_MESSAGE };
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message ?? "Check the form fields." };
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return { error: "An account with these details already exists. Sign in to continue." };
    console.error("[providers] action failed", error);
    return { error: error instanceof Error && !/prisma|database|query/i.test(error.message) ? error.message : "Unable to save. Please try again." };
  }
}
async function limitAction(key: string, limit = 60) {
  const result = await checkRateLimit({ key, limit, windowMs: 3600000 });
  if (!result.allowed) throw new Error("Too many requests. Please try again later.");
}
const id = (form: FormData, key: string) => z.string().min(1).max(100).parse(form.get(key));
export async function registerProvider(_state: ProviderActionState, form: FormData) {
  let verificationRequired = false;
  let verificationDeliveryFailed = false;
  const result = await perform(async () => {
    const requestHeaders = await headers();
    const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const limit = await checkRateLimit({ key: `provider-register:${ip}`, limit: 5, windowMs: 3600000 });
    if (!limit.allowed) throw new Error("Too many registrations. Please try later.");
    const data = profileSchema.parse(Object.fromEntries(form));
    const nationalId = nationalIdSchema.parse(form.get("nationalId"));
    if (form.get("acceptedTerms") !== "on") throw new Error("Accept the terms of use to continue.");
    const session = await getUserSession();
    let email: string | null;
    let emailVerified: Date | null;
    if (session) {
      const existingUser = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, email: true, emailVerified: true } });
      if (!existingUser?.email) throw new Error("Add an email address to your EstateDesk account before applying as a provider.");
      const exists = await prisma.serviceProvider.findUnique({ where: { userId: session.userId } });
      if (exists) throw new Error("Your provider profile already exists. Open your provider portal.");
      email = existingUser.email;
      emailVerified = existingUser.emailVerified;
      await prisma.serviceProvider.create({ data: { ...data, portfolioUrl: data.portfolioUrl || null, nationalId, userId: session.userId, status: "PENDING" } });
    } else {
      const credentials = z.object({
        fullName: z.string().trim().min(2).max(120),
        username: z.string().trim().toLowerCase().min(3).max(30).regex(/^[a-z0-9._-]+$/, "Username must use letters, numbers, dots, underscores, or hyphens."),
        email: z.email().trim().toLowerCase(),
        password: z.string().min(12).max(72),
      }).parse(Object.fromEntries(form));
      const user = await prisma.user.create({ data: { fullName: credentials.fullName, username: credentials.username, email: credentials.email, passwordHash: await bcrypt.hash(credentials.password, 12), termsAcceptedAt: new Date(), termsAcceptedVersion: "2026-06-02", serviceProvider: { create: { ...data, nationalId, portfolioUrl: data.portfolioUrl || null, status: "PENDING" } } } });
      email = user.email;
      emailVerified = user.emailVerified;
    }

    if (!emailVerified && email) {
      verificationRequired = true;
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.emailVerificationToken.deleteMany({ where: { email, usedAt: null } });
      await prisma.emailVerificationToken.create({ data: { email, token: hashOpaqueToken(token, "email-verification"), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } });
      const appUrl = getSiteUrl();
      const verifyUrl = `${appUrl}/verify-email?token=${token}`;
      try {
        await sendTransactionalEmail(email, "Verify your EstateDesk provider account", `Hello,\n\nWe received your service provider application. Verify that you own this email address using the link below. A platform administrator will review your provider profile after verification.\n\n${verifyUrl}\n\nThis link expires in 24 hours. You can sign in after your email is verified and your application is approved.`);
      } catch (error) {
        verificationDeliveryFailed = true;
        console.error("[providers] verification email delivery failed", error);
      }
    }

    revalidatePath("/platform/service-providers");
    revalidatePath("/service-providers");
  }, "Application received. Your profile is awaiting platform approval. We’ll email you when your account is ready to sign in.");
  if (!result.error && verificationRequired) {
    return { message: verificationDeliveryFailed
      ? "Your application was saved, but the verification email could not be sent. Use Resend verification from the sign-in page or contact support."
      : "Application received. Verify your email, then wait for platform approval. We’ll email you when your account is ready to sign in." };
  }
  return result;
}
export async function saveProvider(_state: ProviderActionState, form: FormData) {
  return perform(async () => {
    const { provider } = await requireProvider();
    const data = profileSchema.parse(Object.fromEntries(form));
    await prisma.serviceProvider.update({ where: { id: provider.id }, data: { ...data, portfolioUrl: data.portfolioUrl || null, available: form.get("available") === "on" } });
  });
}
export async function resubmitProviderApplication(_state: ProviderActionState, form: FormData) {
  return perform(async () => {
    const session = await getUserSession();
    if (!session) throw new Error("Sign in to update your provider application.");
    const provider = await prisma.serviceProvider.findUnique({ where: { userId: session.userId }, select: { id: true, status: true } });
    if (!provider || !["CHANGES_REQUESTED", "REJECTED"].includes(provider.status)) throw new Error("Your application is not waiting for corrections.");
    if (provider.status === "REJECTED") throw new Error("This application was declined. Contact EstateDesk support if you believe this decision was made in error.");
    const data = profileSchema.parse(Object.fromEntries(form));
    const nationalId = nationalIdSchema.parse(form.get("nationalId"));
    const updated = await prisma.serviceProvider.updateMany({
      where: { id: provider.id, userId: session.userId, status: "CHANGES_REQUESTED" },
      data: { ...data, nationalId, portfolioUrl: data.portfolioUrl || null, status: "PENDING", reviewFeedback: null, available: false },
    });
    if (!updated.count) throw new Error("Application status changed. Refresh and try again.");
  }, "Corrections submitted. The platform team will review your updated application.");
}
export async function addPortfolio(_state: ProviderActionState, form: FormData) {
  return perform(async () => { const { provider } = await requireProvider(); const data = portfolioSchema.parse(Object.fromEntries(form)); if (await prisma.providerPortfolio.count({ where: { providerId: provider.id } }) >= 30) throw new Error("You can add up to 30 portfolio projects."); await prisma.providerPortfolio.create({ data: { ...data, imageUrl: data.imageUrl || null, providerId: provider.id } }); });
}
export async function deletePortfolio(_state: ProviderActionState, form: FormData) {
  return perform(async () => { const { provider } = await requireProvider(); await prisma.providerPortfolio.deleteMany({ where: { id: id(form, "id"), providerId: provider.id } }); });
}
export async function createJob(_state: ProviderActionState, form: FormData) {
  return perform(async () => {
    const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE"]);
    await limitAction(`provider-job-create:${session.activeOrgId}:${session.userId}`, 30);
    const data = jobSchema.parse(Object.fromEntries(form));
    const paymentTracking = form.get("paymentTracking") === "on";
    await transactionalSubmission(prisma, submissionIdentity(session.userId, `provider-job-create:${session.activeOrgId}`, formSubmissionToken(form), { data, paymentTracking }), async tx => {
      const job = await tx.serviceJob.create({ data: { title: data.title, description: data.description, category: data.category, location: data.location, budget: data.budget || null, paymentTracking, agreedAmount: paymentTracking ? data.agreedAmount || null : null, orgId: session.activeOrgId! } });
      const providers = await tx.serviceProvider.findMany({ where: { status: "ACTIVE", available: true, category: data.category, user: { status: "ACTIVE", deletedAt: null, emailVerified: { not: null } } }, select: { userId: true } });
      await notifyInAppAndPush({ db: tx, orgId: session.activeOrgId!, actorUserId: session.userId, recipients: providers.map(provider => ({ userId: provider.userId })), type: "GENERAL", title: "New job matches your service", message: `${data.title} · ${data.location}${data.budget ? ` · Indicative budget ${data.budget}` : ""}. View the job and apply if it suits you.`, actionUrl: "/provider", providerResponse: { source: "service-provider-marketplace", jobId: job.id }, eventKey: `provider-job-posted:${job.id}` });
      return job.id;
    });
  }, "Job published. Matching available providers have been notified.");
}
export async function recordProviderJobPayment(_state: ProviderActionState, form: FormData) {
  return perform(async () => {
    const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE"]);
    const jobId = id(form, "jobId");
    const amount = z.string().regex(/^\d+(\.\d{1,2})?$/, "Enter an amount in KES with up to two decimal places.").refine(value => Number(value) > 0 && Number(value) <= 9999999999).parse(form.get("amount"));
    const method = z.enum(["MPESA", "BANK_TRANSFER", "CASH", "OTHER"]).parse(form.get("method"));
    const reference = z.string().trim().max(160).optional().parse(form.get("reference") || undefined) ?? "";
    const note = z.string().trim().max(1000).optional().parse(form.get("note") || undefined) ?? "";
    await transactionalSubmission(prisma, submissionIdentity(session.userId, `provider-payment:${session.activeOrgId}:${jobId}`, formSubmissionToken(form), { amount, method, reference, note }), async tx => {
      const locked = await tx.serviceJob.updateMany({ where: { id: jobId, orgId: session.activeOrgId!, paymentTracking: true, providerId: { not: null }, status: { in: ["ASSIGNED", "IN_PROGRESS", "SUBMITTED", "COMPLETED"] } }, data: { updatedAt: new Date() } });
      if (!locked.count) throw new Error("Payment tracking is not enabled for this active or completed job.");
      const job = await tx.serviceJob.findUniqueOrThrow({ where: { id: jobId }, select: { id: true, title: true, agreedAmount: true, provider: { select: { userId: true } } } });
      if (!job.provider) throw new Error("This job has no assigned provider.");
      const total = await tx.providerJobPayment.aggregate({ where: { jobId, status: { not: "VOIDED" } }, _sum: { amount: true } });
      const nextTotal = new Prisma.Decimal(total._sum.amount ?? 0).plus(amount);
      if (job.agreedAmount && nextTotal.greaterThan(job.agreedAmount)) throw new Error("This payment would exceed the agreed job amount. Review the recorded payments first.");
      const payment = await tx.providerJobPayment.create({ data: { jobId, amount, method, reference: reference || null, note: note || null, reportedByUserId: session.userId } });
      await notifyInAppAndPush({ db: tx, orgId: session.activeOrgId!, actorUserId: session.userId, recipients: [{ userId: job.provider.userId }], type: "GENERAL", title: "Job payment recorded", message: `The organisation recorded KES ${Number(amount).toLocaleString("en-KE")} for “${job.title}” by ${method.replaceAll("_", " ").toLowerCase()}. Confirm receipt or report a problem in your provider workspace.`, actionUrl: "/provider", providerResponse: { source: "service-provider-marketplace", jobId, paymentId: payment.id }, eventKey: `provider-job-payment:${payment.id}` });
      return payment.id;
    });
  }, "Payment recorded. The provider has been asked to confirm receipt.");
}
export async function respondToProviderJobPayment(_state: ProviderActionState, form: FormData) {
  return perform(async () => {
    const { session, provider } = await requireProvider();
    const paymentId = id(form, "paymentId");
    const status = z.enum(["CONFIRMED", "DISPUTED"]).parse(form.get("status"));
    const responseNote = z.string().trim().max(1000).optional().parse(form.get("responseNote") || undefined) ?? "";
    if (status === "DISPUTED" && responseNote.length < 10) throw new Error("Explain the payment issue in at least 10 characters.");
    await prisma.$transaction(async tx => {
      const payment = await tx.providerJobPayment.findFirst({ where: { id: paymentId, job: { providerId: provider.id, paymentTracking: true, org: { status: "ACTIVE", deletedAt: null } }, status: "RECORDED" }, include: { job: { select: { id: true, orgId: true, title: true } } } });
      if (!payment) throw new Error("This payment is no longer awaiting your response.");
      const changed = await tx.providerJobPayment.updateMany({ where: { id: paymentId, status: "RECORDED" }, data: { status, providerResponseNote: responseNote || null, confirmedAt: status === "CONFIRMED" ? new Date() : null } });
      if (!changed.count) throw new Error("Payment status changed. Refresh and try again.");
      const recipients = await tx.membership.findMany({ where: { orgId: payment.job.orgId, role: { in: ["ADMIN", "MANAGER", "OFFICE"] } }, select: { userId: true } });
      await notifyInAppAndPush({ db: tx, orgId: payment.job.orgId, actorUserId: session.userId, recipients, type: "GENERAL", title: status === "CONFIRMED" ? "Provider confirmed payment" : "Provider queried a payment", message: status === "CONFIRMED" ? `The provider confirmed receipt of KES ${Number(payment.amount).toLocaleString("en-KE")} for “${payment.job.title}”.` : `The provider reported a problem with the KES ${Number(payment.amount).toLocaleString("en-KE")} payment for “${payment.job.title}”: ${responseNote}`, actionUrl: "/dashboard/org/service-providers", eventKey: `provider-job-payment-response:${paymentId}:${status}` });
    });
  }, "Your payment response was sent to the organisation.");
}
export async function resolveProviderJobPayment(_state: ProviderActionState, form: FormData) {
  return perform(async () => {
    const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE"]);
    const paymentId = id(form, "paymentId");
    const status = z.enum(["CONFIRMED", "VOIDED"]).parse(form.get("status"));
    const resolutionNote = z.string().trim().min(10).max(1000).parse(form.get("resolutionNote"));
    await prisma.$transaction(async tx => {
      const payment = await tx.providerJobPayment.findFirst({ where: { id: paymentId, job: { orgId: session.activeOrgId!, paymentTracking: true }, status: "DISPUTED" }, include: { job: { select: { id: true, orgId: true, title: true, provider: { select: { userId: true } } } } } });
      if (!payment) throw new Error("This payment is not awaiting dispute resolution.");
      if (!payment.job.provider) throw new Error("This job no longer has an assigned provider.");
      const changed = await tx.providerJobPayment.updateMany({ where: { id: paymentId, status: "DISPUTED" }, data: { status, resolutionNote, ...(status === "CONFIRMED" ? { confirmedAt: new Date() } : {}) } });
      if (!changed.count) throw new Error("Payment status changed. Refresh and try again.");
      await notifyInAppAndPush({ db: tx, orgId: payment.job.orgId, actorUserId: session.userId, recipients: [{ userId: payment.job.provider.userId }], type: "GENERAL", title: status === "CONFIRMED" ? "Payment query resolved" : "Payment record voided", message: `The organisation ${status === "CONFIRMED" ? "confirmed" : "voided"} the KES ${Number(payment.amount).toLocaleString("en-KE")} record for “${payment.job.title}”. Resolution: ${resolutionNote}`, actionUrl: "/provider", providerResponse: { source: "service-provider-marketplace", jobId: payment.job.id, paymentId }, eventKey: `provider-job-payment-resolved:${paymentId}:${status}` });
    });
  }, "Payment query resolved and the provider notified.");
}
export async function applyToJob(_state: ProviderActionState, form: FormData) {
  return perform(async () => { const { provider } = await requireProvider(true); await limitAction(`provider-apply:${provider.id}`, 60); await applyForJob(provider.id, id(form, "jobId"), z.string().trim().min(10).max(2000).parse(form.get("message"))); });
}
export async function withdrawApplication(_state: ProviderActionState, form: FormData) {
  return perform(async () => {
    const { session, provider } = await requireProvider(true);
    await withdrawJobApplication(provider.id, session.userId, id(form, "applicationId"));
  }, "Application withdrawn. The organisation has been notified.");
}
export async function hireForJob(_state: ProviderActionState, form: FormData) {
  return perform(async () => { const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE"]); await hireProvider(session.activeOrgId!, id(form, "jobId"), id(form, "providerId"), session.userId); }, "Job offer sent to the provider.");
}
export async function reviewProviderJobApplication(_state: ProviderActionState, form: FormData) {
  return perform(async () => {
    const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE"]);
    const status = z.enum(["REVIEWING", "DECLINED"]).parse(form.get("status"));
    const reviewNote = z.string().trim().max(1000).optional().parse(form.get("reviewNote") || undefined) ?? "";
    if (status === "DECLINED" && reviewNote.length < 10) throw new Error("Add at least 10 characters of feedback when declining an application.");
    await reviewJobApplication(session.activeOrgId!, session.userId, id(form, "applicationId"), status, reviewNote);
  }, "Application status updated and the provider notified.");
}
export async function declineJobOffer(_state: ProviderActionState, form: FormData) {
  return perform(async () => {
    const { session, provider } = await requireProvider();
    await declineProviderJob(provider.id, session.userId, id(form, "jobId"));
  }, "Offer declined. The organisation has been notified.");
}
export async function updateProviderJob(_state: ProviderActionState, form: FormData) {
  return perform(async () => {
    const { session, provider } = await requireProvider();
    const operation = z.enum(["accept", "submit"]).parse(form.get("operation"));
    const completionNotes = operation === "submit" ? z.string().trim().min(10).max(3000).parse(form.get("completionNotes")) : undefined;
    await updateProviderJobService(provider.id, session.userId, id(form, "jobId"), operation, completionNotes);
  }, "Job update sent to the organisation.");
}
export async function completeJob(_state: ProviderActionState, form: FormData) {
  return perform(async () => { const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE"]); await confirmAndReview(session.activeOrgId!, id(form, "jobId"), reviewSchema.parse(Object.fromEntries(form)), session.userId); }, "Work confirmed and review published.");
}
export async function cancelJob(_state: ProviderActionState, form: FormData) {
  return perform(async () => {
    const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE"]);
    const jobId = id(form, "jobId");
    await prisma.$transaction(async tx => {
      const job = await tx.serviceJob.findFirst({ where: { id: jobId, orgId: session.activeOrgId!, status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS", "SUBMITTED"] } }, select: { title: true } });
      if (!job) throw new Error("Job cannot be cancelled.");
      const changed = await tx.serviceJob.updateMany({ where: { id: jobId, orgId: session.activeOrgId!, status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS", "SUBMITTED"] } }, data: { status: "CANCELLED" } });
      if (!changed.count) throw new Error("Job status changed. Refresh and try again.");
      await tx.jobApplication.updateMany({ where: { jobId, status: { in: ["PENDING", "REVIEWING", "SELECTED"] } }, data: { status: "CANCELLED", reviewNote: "The organisation cancelled this job.", updatedAt: new Date() } });
      const applications = await tx.jobApplication.findMany({ where: { jobId, status: "CANCELLED" }, select: { provider: { select: { userId: true } } } });
      const jobProvider = await tx.serviceProvider.findFirst({ where: { jobs: { some: { id: jobId } } }, select: { userId: true } });
      const recipients = [...new Set([...applications.map(application => application.provider.userId), ...(jobProvider ? [jobProvider.userId] : [])])].map(userId => ({ userId }));
      await notifyInAppAndPush({ db: tx, orgId: session.activeOrgId!, actorUserId: session.userId, recipients, type: "GENERAL", title: "Service job cancelled", message: `“${job.title}” has been cancelled by the organisation.`, actionUrl: "/provider", providerResponse: { source: "service-provider-marketplace", jobId }, eventKey: `provider-job-cancelled:${jobId}` });
    });
  }, "Job cancelled. Applicants and the assigned provider have been notified.");
}
export async function reportHiredProvider(_state: ProviderActionState, form: FormData) {
  return perform(async () => { const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE"]); await reportProvider(session.activeOrgId!, id(form, "jobId"), z.string().trim().min(20).max(3000).parse(form.get("reason"))); });
}
export async function moderateProvider(_state: ProviderActionState, form: FormData) {
  let sendStatusEmail: { email: string; fullName: string; username: string | null; status: string; reason: string } | null = null;
  let emailDeliveryFailed = false;
  const result = await perform(async () => {
    const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
    const providerId = id(form, "providerId");
    const status = z.enum(["PENDING", "CHANGES_REQUESTED", "REJECTED", "ACTIVE", "FLAGGED", "SUSPENDED", "DELETED"]).parse(form.get("status"));
    const reason = z.string().trim().min(10).max(2000).parse(form.get("reason"));
    await prisma.$transaction(async tx => {
      const provider = await tx.serviceProvider.findUniqueOrThrow({ where: { id: providerId }, include: { user: { select: { email: true, emailVerified: true, fullName: true, username: true } } } });
      const allowedTransitions: Record<string, string[]> = {
        PENDING: ["PENDING", "ACTIVE", "CHANGES_REQUESTED", "REJECTED"],
        CHANGES_REQUESTED: ["CHANGES_REQUESTED", "ACTIVE", "REJECTED"],
        REJECTED: ["REJECTED", "DELETED"],
        ACTIVE: ["ACTIVE", "FLAGGED", "SUSPENDED", "DELETED"],
        FLAGGED: ["FLAGGED", "ACTIVE", "SUSPENDED", "DELETED"],
        SUSPENDED: ["SUSPENDED", "ACTIVE", "DELETED"],
        DELETED: [],
      };
      if (!allowedTransitions[provider.status]?.includes(status)) throw new Error("This provider status change is not allowed.");
      if (status === "ACTIVE" && provider.status !== "ACTIVE") {
        if (!provider.user.emailVerified) throw new Error("The provider must verify their email before approval.");
        if (!provider.user.email) throw new Error("The provider account has no email address for its approval notice.");
      }
      if (["ACTIVE", "CHANGES_REQUESTED", "REJECTED"].includes(status) && status !== provider.status && provider.user.email) {
        sendStatusEmail = { email: provider.user.email, fullName: provider.user.fullName, username: provider.user.username, status, reason };
      }
      const updated = await tx.serviceProvider.updateMany({ where: { id: providerId, status: provider.status }, data: { status, reviewFeedback: status === "CHANGES_REQUESTED" || status === "REJECTED" ? reason : null, ...(status === "ACTIVE" && ["PENDING", "CHANGES_REQUESTED"].includes(provider.status) ? { reviewedAt: new Date() } : {}), ...(status === "DELETED" ? { businessName: "Removed provider", bio: "", portfolioUrl: null, available: false, lastSeenAt: null } : {}) } });
      if (updated.count !== 1) throw new Error("Provider status changed while you were reviewing it. Refresh and try again.");
      if (status === "DELETED") await tx.providerPortfolio.deleteMany({ where: { providerId } });
      await tx.auditLog.create({ data: { actorUserId: session.userId, action: `PROVIDER_${status}`, entityType: "ServiceProvider", entityId: providerId, metadata: { reason, previousStatus: provider.status } } });
      const reportId = form.get("reportId");
      if (typeof reportId === "string" && reportId) await tx.providerReport.updateMany({ where: { id: reportId, providerId, resolvedAt: null }, data: { resolvedAt: new Date(), resolvedByUserId: session.userId, resolution: `${status}: ${reason}` } });
    });
    if (sendStatusEmail) {
      const appUrl = getSiteUrl();
      const loginUrl = `${appUrl}/login`;
      const outcome = sendStatusEmail.status === "ACTIVE"
        ? `Your service provider account has been approved. Sign in with your username${sendStatusEmail.username ? ` (${sendStatusEmail.username})` : ""} or email and the password you created.`
        : sendStatusEmail.status === "CHANGES_REQUESTED"
          ? `We need you to update your provider application before we can approve it. Sign in to review the feedback and resubmit your profile.\n\nFeedback: ${sendStatusEmail.reason}`
          : `Your provider application was declined. If you believe this decision was made in error, contact EstateDesk support.\n\nReason: ${sendStatusEmail.reason}`;
      try {
        await sendTransactionalEmail(sendStatusEmail.email, `EstateDesk provider application update`, `Hello ${sendStatusEmail.fullName},\n\n${outcome}\n\nSign in: ${loginUrl}\n\nYour provider portal will show the current application status.`);
      } catch (error) {
        emailDeliveryFailed = true;
        console.error("[providers] approval email delivery failed", error);
      }
    }
  }, "Provider moderation saved.");
  if (emailDeliveryFailed && !result.error) return { message: "Provider status was saved, but the email could not be delivered. Please contact the provider directly." };
  return result;
}
export async function dismissProviderReport(_state: ProviderActionState, form: FormData) {
  return perform(async () => { const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]); const reason = z.string().trim().min(10).max(2000).parse(form.get("reason")); await prisma.$transaction(async tx => { const reportId = id(form, "reportId"); const result = await tx.providerReport.updateMany({ where: { id: reportId, resolvedAt: null }, data: { resolvedAt: new Date(), resolvedByUserId: session.userId, resolution: `Dismissed: ${reason}` } }); if (!result.count) throw new Error("Report already reviewed."); await tx.auditLog.create({ data: { actorUserId: session.userId, action: "PROVIDER_REPORT_DISMISSED", entityType: "ProviderReport", entityId: reportId, metadata: { reason } } }); }); });
}
export async function providerHeartbeat() {
  const { provider } = await requireProvider();
  await prisma.serviceProvider.updateMany({ where: { id: provider.id, status: { in: ["ACTIVE", "FLAGGED"] } }, data: { lastSeenAt: new Date() } });
}
