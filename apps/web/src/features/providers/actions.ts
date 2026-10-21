"use server";
import bcrypt from "bcryptjs";
import { nationalIdSchema, isDuplicateIdentityError, DUPLICATE_ID_MESSAGE } from "@/features/identity/policy";
import { headers } from "next/headers";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth/session";
import { requireOrgRole, requirePlatformRole } from "@/lib/permissions/guards";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireProvider } from "./access";
import { profileSchema, portfolioSchema, jobSchema, reviewSchema } from "./policy";
import { applyForJob, hireProvider, confirmAndReview, reportProvider } from "./service";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import crypto from "node:crypto";
import { hashOpaqueToken } from "@/lib/crypto/tokens";
import { getSiteUrl } from "@/lib/seo";
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
      await sendTransactionalEmail(email, "Verify your EstateDesk provider account", `Hello,\n\nWe received your service provider application. Verify that you own this email address using the link below. A platform administrator will review your provider profile after verification.\n\n${verifyUrl}\n\nThis link expires in 24 hours. You can sign in after your email is verified and your application is approved.`);
    }

    revalidatePath("/platform/service-providers");
    revalidatePath("/service-providers");
  }, "Application received. Your profile is awaiting platform approval. We’ll email you when your account is ready to sign in.");
  if (!result.error && verificationRequired) {
    return { message: "Application received. Verify your email, then wait for platform approval. We’ll email you when your account is ready to sign in." };
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
export async function addPortfolio(_state: ProviderActionState, form: FormData) {
  return perform(async () => { const { provider } = await requireProvider(); const data = portfolioSchema.parse(Object.fromEntries(form)); if (await prisma.providerPortfolio.count({ where: { providerId: provider.id } }) >= 30) throw new Error("You can add up to 30 portfolio projects."); await prisma.providerPortfolio.create({ data: { ...data, imageUrl: data.imageUrl || null, providerId: provider.id } }); });
}
export async function deletePortfolio(_state: ProviderActionState, form: FormData) {
  return perform(async () => { const { provider } = await requireProvider(); await prisma.providerPortfolio.deleteMany({ where: { id: id(form, "id"), providerId: provider.id } }); });
}
export async function createJob(_state: ProviderActionState, form: FormData) {
  return perform(async () => { const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE"]); await limitAction(`provider-job-create:${session.activeOrgId}:${session.userId}`, 30); const data = jobSchema.parse(Object.fromEntries(form)); await prisma.serviceJob.create({ data: { ...data, budget: data.budget || null, orgId: session.activeOrgId! } }); });
}
export async function applyToJob(_state: ProviderActionState, form: FormData) {
  return perform(async () => { const { provider } = await requireProvider(true); await limitAction(`provider-apply:${provider.id}`, 60); await applyForJob(provider.id, id(form, "jobId"), z.string().trim().min(10).max(2000).parse(form.get("message"))); });
}
export async function hireForJob(_state: ProviderActionState, form: FormData) {
  return perform(async () => { const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE"]); await hireProvider(session.activeOrgId!, id(form, "jobId"), id(form, "providerId")); });
}
export async function updateProviderJob(_state: ProviderActionState, form: FormData) {
  return perform(async () => {
    const { provider } = await requireProvider();
    const operation = z.enum(["accept", "submit"]).parse(form.get("operation"));
    const completionNotes = operation === "submit" ? z.string().trim().min(10).max(3000).parse(form.get("completionNotes")) : undefined;
    const result = await prisma.serviceJob.updateMany({ where: { id: id(form, "jobId"), providerId: provider.id, provider: { status: { in: ["ACTIVE", "FLAGGED"] } }, status: operation === "accept" ? "ASSIGNED" : "IN_PROGRESS" }, data: { status: operation === "accept" ? "IN_PROGRESS" : "SUBMITTED", ...(completionNotes ? { completionNotes } : {}) } });
    if (!result.count) throw new Error("This job is not assigned to you or its status has changed.");
  });
}
export async function completeJob(_state: ProviderActionState, form: FormData) {
  return perform(async () => { const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE"]); await confirmAndReview(session.activeOrgId!, id(form, "jobId"), reviewSchema.parse(Object.fromEntries(form))); });
}
export async function cancelJob(_state: ProviderActionState, form: FormData) {
  return perform(async () => { const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE"]); const result = await prisma.serviceJob.updateMany({ where: { id: id(form, "jobId"), orgId: session.activeOrgId!, status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS", "SUBMITTED"] } }, data: { status: "CANCELLED" } }); if (!result.count) throw new Error("Job cannot be cancelled."); });
}
export async function reportHiredProvider(_state: ProviderActionState, form: FormData) {
  return perform(async () => { const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE"]); await reportProvider(session.activeOrgId!, id(form, "jobId"), z.string().trim().min(20).max(3000).parse(form.get("reason"))); });
}
export async function moderateProvider(_state: ProviderActionState, form: FormData) {
  let sendApprovalEmail: { email: string; fullName: string; username: string | null } | null = null;
  let emailDeliveryFailed = false;
  const result = await perform(async () => {
    const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
    const providerId = id(form, "providerId");
    const status = z.enum(["PENDING", "ACTIVE", "FLAGGED", "SUSPENDED", "DELETED"]).parse(form.get("status"));
    const reason = z.string().trim().min(10).max(2000).parse(form.get("reason"));
    await prisma.$transaction(async tx => {
      const provider = await tx.serviceProvider.findUniqueOrThrow({ where: { id: providerId }, include: { user: { select: { email: true, emailVerified: true, fullName: true, username: true } } } });
      if (provider.status === "DELETED") throw new Error("Removed profiles cannot be restored. Job history is retained.");
      if (provider.status === "PENDING" && status !== "PENDING" && status !== "ACTIVE") {
        throw new Error("A new provider application must be approved or left pending. Verify the email before approval.");
      }
      if (provider.status === "PENDING" && status === "ACTIVE") {
        if (!provider.user.emailVerified) throw new Error("The provider must verify their email before approval.");
        if (!provider.user.email) throw new Error("The provider account has no email address for its approval notice.");
        sendApprovalEmail = { email: provider.user.email, fullName: provider.user.fullName, username: provider.user.username };
      }
      const updated = await tx.serviceProvider.updateMany({ where: { id: providerId, status: provider.status }, data: { status, ...(status === "DELETED" ? { businessName: "Removed provider", bio: "", portfolioUrl: null, available: false, lastSeenAt: null } : {}) } });
      if (updated.count !== 1) throw new Error("Provider status changed while you were reviewing it. Refresh and try again.");
      if (status === "DELETED") await tx.providerPortfolio.deleteMany({ where: { providerId } });
      await tx.auditLog.create({ data: { actorUserId: session.userId, action: `PROVIDER_${status}`, entityType: "ServiceProvider", entityId: providerId, metadata: { reason, previousStatus: provider.status } } });
      const reportId = form.get("reportId");
      if (typeof reportId === "string" && reportId) await tx.providerReport.updateMany({ where: { id: reportId, providerId, resolvedAt: null }, data: { resolvedAt: new Date(), resolvedByUserId: session.userId, resolution: `${status}: ${reason}` } });
    });
    if (sendApprovalEmail) {
      const appUrl = getSiteUrl();
      const loginUrl = `${appUrl}/login`;
      try {
        await sendTransactionalEmail(sendApprovalEmail.email, "Your EstateDesk provider account is approved", `Hello ${sendApprovalEmail.fullName},\n\nYour service provider account has been approved by EstateDesk and is ready to use. Sign in with your username${sendApprovalEmail.username ? ` (${sendApprovalEmail.username})` : ""} or email address and the password you created.\n\nSign in: ${loginUrl}\n\nYour provider portal will open after you sign in.`);
      } catch (error) {
        emailDeliveryFailed = true;
        console.error("[providers] approval email delivery failed", error);
      }
    }
  }, "Provider moderation saved.");
  if (emailDeliveryFailed && !result.error) return { message: "Provider approved, but the confirmation email could not be delivered. Please contact the provider directly." };
  return result;
}
export async function dismissProviderReport(_state: ProviderActionState, form: FormData) {
  return perform(async () => { const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]); const reason = z.string().trim().min(10).max(2000).parse(form.get("reason")); await prisma.$transaction(async tx => { const reportId = id(form, "reportId"); const result = await tx.providerReport.updateMany({ where: { id: reportId, resolvedAt: null }, data: { resolvedAt: new Date(), resolvedByUserId: session.userId, resolution: `Dismissed: ${reason}` } }); if (!result.count) throw new Error("Report already reviewed."); await tx.auditLog.create({ data: { actorUserId: session.userId, action: "PROVIDER_REPORT_DISMISSED", entityType: "ProviderReport", entityId: reportId, metadata: { reason } } }); }); });
}
export async function providerHeartbeat() {
  const { provider } = await requireProvider();
  await prisma.serviceProvider.updateMany({ where: { id: provider.id, status: { in: ["ACTIVE", "FLAGGED"] } }, data: { lastSeenAt: new Date() } });
}
