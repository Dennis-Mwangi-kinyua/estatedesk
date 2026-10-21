"use server";

import { ClientSafeError } from "@/lib/errors/client-safe-error";
import { scopedUnitWhere } from "@/lib/permissions/record-scope";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cancelLeaseSignatureEnvelope, createLeaseSignatureEnvelope, remindLeaseSigner } from "@/lib/leases/signing";
import { prisma } from "@/lib/prisma";
import { issuePendingLeaseSigningUrl } from "@/lib/tenant/get-tenant-portal-context";
import { requireOrgPermission } from "@/lib/permissions/guards";
import { encodePublicId } from "@/lib/public-id";

export async function createSigningRequestAction(formData: FormData) {
  const session = await requireOrgPermission("leases.manage");
  const leaseId = String(formData.get("leaseId") ?? "");
  const additionalSigners: Array<{ userId: string; role: "TENANT" | "WITNESS" | "GUARANTOR" | "LANDLORD" }> = [];
  for (const userId of formData.getAll("additionalTenantUserIds").map(String).filter(Boolean)) additionalSigners.push({ userId, role: "TENANT" });
  for (const role of ["WITNESS", "GUARANTOR", "LANDLORD"] as const) {
    const userId = String(formData.get(`${role.toLowerCase()}UserId`) ?? "");
    if (userId) additionalSigners.push({ userId, role });
  }
  const path = `/dashboard/org/leases/${encodePublicId(leaseId, "lease")}/signing`;
  try {
    await createLeaseSignatureEnvelope({ leaseId, orgId: session.activeOrgId!, createdByUserId: session.userId, expiresInDays: Number(formData.get("expiresInDays") ?? 14), message: String(formData.get("message") ?? "").trim() || null, jurisdiction: String(formData.get("jurisdiction") ?? "KENYA") as "KENYA" | "UAE", signingOrder: "SEQUENTIAL", additionalSigners, amendment: formData.get("amendment") === "on" });
  } catch (error) {
    const message = error instanceof ClientSafeError ? error.message : "Could not send the agreement. Please try again.";
    redirect(`${path}?error=${encodeURIComponent(message)}`);
  }
  revalidatePath(path);
  revalidatePath("/dashboard/tenant/lease");
  redirect(`${path}?sent=1`);
}

export async function cancelSigningRequestAction(formData: FormData) {
  const session = await requireOrgPermission("leases.manage");
  const leaseId = String(formData.get("leaseId") ?? "");
  const allowed = await prisma.leaseSignatureEnvelope.count({ where: { id: String(formData.get("envelopeId") ?? ""), leaseId, orgId: session.activeOrgId!, lease: { unit: scopedUnitWhere(session.activeOrgId!, session.membershipScope) } } });
  if (!allowed) throw new Error("Signing request not found in your assigned scope.");
  await cancelLeaseSignatureEnvelope(String(formData.get("envelopeId") ?? ""), session.activeOrgId!, session.userId, String(formData.get("reason") ?? ""));
  revalidatePath(`/dashboard/org/leases/${encodePublicId(leaseId, "lease")}/signing`);
}

export async function remindSignerAction(formData: FormData) {
  const session = await requireOrgPermission("leases.manage");
  const leaseId = String(formData.get("leaseId") ?? "");
  const allowed = await prisma.leaseSignatureEnvelope.count({ where: { id: String(formData.get("envelopeId") ?? ""), leaseId, orgId: session.activeOrgId!, lease: { unit: scopedUnitWhere(session.activeOrgId!, session.membershipScope) } } });
  if (!allowed) throw new Error("Signing request not found in your assigned scope.");
  await remindLeaseSigner(String(formData.get("envelopeId") ?? ""), String(formData.get("signerId") ?? ""), session.activeOrgId!, session.userId);
  revalidatePath(`/dashboard/org/leases/${encodePublicId(leaseId, "lease")}/signing`);
}

export async function resumeOrganizationSigningAction(formData: FormData) {
  const session = await requireOrgPermission("leases.manage");
  const signerId = String(formData.get("signerId") ?? "");
  const signer = await prisma.leaseSignatureSigner.findFirst({ where: {
    id: signerId, role: "ORGANIZATION", userId: session.userId, envelope: { orgId: session.activeOrgId!, lease: { unit: scopedUnitWhere(session.activeOrgId!, session.membershipScope) } },
  }, select: { id: true } });
  if (!signer) throw new Error("This signature is assigned to another organization representative.");
  const url = await issuePendingLeaseSigningUrl(signer.id, session.userId);
  if (!url) throw new Error("This signing request is no longer active.");
  redirect(url);
}
