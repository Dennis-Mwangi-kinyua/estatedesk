"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cancelLeaseSignatureEnvelope, createLeaseSignatureEnvelope, remindLeaseSigner } from "@/lib/leases/signing";
import { requireOrgRole } from "@/lib/permissions/guards";

export async function createSigningRequestAction(formData: FormData) {
  const session = await requireOrgRole(["ADMIN", "MANAGER"]);
  const leaseId = String(formData.get("leaseId") ?? "");
  const additionalSigners: Array<{ userId: string; role: "TENANT" | "WITNESS" | "GUARANTOR" | "LANDLORD" }> = [];
  for (const userId of formData.getAll("additionalTenantUserIds").map(String).filter(Boolean)) additionalSigners.push({ userId, role: "TENANT" });
  for (const role of ["WITNESS", "GUARANTOR", "LANDLORD"] as const) {
    const userId = String(formData.get(`${role.toLowerCase()}UserId`) ?? "");
    if (userId) additionalSigners.push({ userId, role });
  }
  const result = await createLeaseSignatureEnvelope({ leaseId, orgId: session.activeOrgId!, createdByUserId: session.userId, expiresInDays: Number(formData.get("expiresInDays") ?? 14), message: String(formData.get("message") ?? "").trim() || null, jurisdiction: String(formData.get("jurisdiction") ?? "KENYA") as "KENYA" | "UAE", signingOrder: String(formData.get("signingOrder") ?? "SEQUENTIAL") as "SEQUENTIAL" | "PARALLEL", additionalSigners, amendment: formData.get("amendment") === "on" });
  redirect(result.organizationSigningUrl);
}

export async function cancelSigningRequestAction(formData: FormData) {
  const session = await requireOrgRole(["ADMIN", "MANAGER"]);
  const leaseId = String(formData.get("leaseId") ?? "");
  await cancelLeaseSignatureEnvelope(String(formData.get("envelopeId") ?? ""), session.activeOrgId!, session.userId, String(formData.get("reason") ?? ""));
  revalidatePath(`/dashboard/org/leases/${leaseId}/signing`);
}

export async function remindSignerAction(formData: FormData) {
  const session = await requireOrgRole(["ADMIN", "MANAGER"]);
  const leaseId = String(formData.get("leaseId") ?? "");
  await remindLeaseSigner(String(formData.get("envelopeId") ?? ""), String(formData.get("signerId") ?? ""), session.activeOrgId!, session.userId);
  revalidatePath(`/dashboard/org/leases/${leaseId}/signing`);
}
