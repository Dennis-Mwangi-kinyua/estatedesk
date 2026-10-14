"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole, requirePlatformRole } from "@/lib/permissions/guards";
import { safeClientMessage } from "@/lib/errors/client-safe-error";
import { verificationSchema } from "./policy";
import { identityOwners, linkVerifiedIdentity } from "./service";
import type { ProviderActionState } from "@/features/providers/actions";
import { checkRateLimit } from "@/lib/rate-limit";
async function perform(work: () => Promise<void>): Promise<ProviderActionState> { try { await work(); revalidatePath("/dashboard/org/identity-verification"); revalidatePath("/platform/identity-verification"); return { message: "Saved successfully." }; } catch (error) { if (error instanceof z.ZodError) return { error: error.issues[0]?.message }; return { error: safeClientMessage(error, "Unable to save. Please try again.") }; } }
export async function requestIdentityVerification(_state: ProviderActionState, form: FormData) {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE"]);
  return perform(async () => {
    const data = verificationSchema.parse(Object.fromEntries(form));
    if (!["TENANT", "LANDLORD"].includes(data.requestedRole) && session.activeOrgRole !== "ADMIN") throw new Error("Only organisation admins may request staff-account linking.");
    const limit = await checkRateLimit({ key: `identity-request:${session.activeOrgId}:${session.userId}`, limit: 20, windowMs: 3600000 });
    if (!limit.allowed) throw new Error("Too many requests. Try again later.");
    const owners = await identityOwners(data.number);
    if (!owners.length) throw new Error("This ID is not registered. Use the normal registration form.");
    const existing = await prisma.identityVerificationRequest.findFirst({ where: { orgId: session.activeOrgId!, number: data.number, requestedRole: data.requestedRole, status: { in: ["PENDING", "APPROVED"] } } });
    if (existing) throw new Error("A request for this ID and role is already awaiting review or ready to link.");
    await prisma.$transaction(async tx => { const request = await tx.identityVerificationRequest.create({ data: { ...data, email: data.email || null, orgId: session.activeOrgId!, requestedByUserId: session.userId } }); await tx.auditLog.create({ data: { orgId: session.activeOrgId!, actorUserId: session.userId, action: "ID_VERIFICATION_REQUESTED", entityType: "IdentityVerificationRequest", entityId: request.id } }); });
  });
}
export async function reviewIdentityVerification(_state: ProviderActionState, form: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
  return perform(async () => {
    const requestId = z.string().min(1).max(100).parse(form.get("requestId"));
    const status = z.enum(["APPROVED", "REJECTED"]).parse(form.get("status"));
    const reviewNotes = z.string().trim().min(20).max(3000).parse(form.get("reviewNotes"));
    if (status === "APPROVED" && form.get("identityConfirmed") !== "on") throw new Error("Confirm that you authenticated the person’s ID and consent to link the account.");
    await prisma.$transaction(async tx => {
      const request = await tx.identityVerificationRequest.findUniqueOrThrow({ where: { id: requestId } });
      const owners = await identityOwners(request.number, tx);
      let verifiedUserId: string | null = null;
      if (status === "APPROVED") {
        if (owners.length !== 1 || !owners[0].userId) throw new Error("This ID has conflicting or unlinked legacy records. Correct those records before approving account linking.");
        const user = await tx.user.findFirst({ where: { id: owners[0].userId, status: "ACTIVE", deletedAt: null } });
        if (!user) throw new Error("The registered account is inactive.");
        verifiedUserId = user.id;
      }
      const result = await tx.identityVerificationRequest.updateMany({ where: { id: requestId, status: "PENDING" }, data: { status, reviewNotes, reviewedByUserId: session.userId, reviewedAt: new Date(), verifiedUserId } });
      if (!result.count) throw new Error("This request has already been reviewed.");
      await tx.auditLog.create({ data: { actorUserId: session.userId, action: `ID_VERIFICATION_${status}`, entityType: "IdentityVerificationRequest", entityId: requestId, metadata: { reviewNotes, verifiedUserId } } });
    });
  });
}
export async function linkApprovedIdentity(_state: ProviderActionState, form: FormData) {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE"]);
  return perform(async () => {
    const requestId = z.string().min(1).max(100).parse(form.get("requestId"));
    const request = await prisma.identityVerificationRequest.findFirst({ where: { id: requestId, orgId: session.activeOrgId! }, select: { requestedRole: true } });
    if (!request) throw new Error("Request not found in your organisation.");
    if (!["TENANT", "LANDLORD"].includes(request.requestedRole) && session.activeOrgRole !== "ADMIN") throw new Error("Only organisation admins may link staff accounts.");
    await linkVerifiedIdentity(session.activeOrgId!, requestId, session.userId);
    revalidatePath("/dashboard/org/tenants"); revalidatePath("/staff");
  });
}
