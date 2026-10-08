"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/security";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { requireCurrentOrgId, requireOrgAccess } from "@/lib/auth/org";
import { requireUserSession } from "@/lib/auth/session";

export type OrganizationNameState = { status: "idle" | "error" | "success"; message?: string; name?: string };

async function saveName(orgId: string, actorUserId: string, formData: FormData): Promise<OrganizationNameState> {
  const raw = formData.get("organizationName");
  const name = typeof raw === "string" ? raw.trim() : "";
  if (name.length < 2 || name.length > 200) return { status: "error", message: "Enter an organisation name between 2 and 200 characters." };
  try {
    const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { id: true, name: true, slug: true, deletedAt: true } });
    if (!org || org.deletedAt) return { status: "error", message: "This organisation is no longer available." };
    if (org.name !== name) {
      await prisma.organization.update({ where: { id: org.id, deletedAt: null }, data: { name } });
      await writeAuditLog({ orgId: org.id, actorUserId, action: "ORGANIZATION_RENAMED", entityType: "Organization", entityId: org.id, beforeState: { name: org.name }, afterState: { name } });
    }
    revalidatePath("/", "layout");
    revalidatePath("/platform/organizations");
    revalidatePath(`/platform/organizations/${org.slug}`);
    revalidatePath("/dashboard/org/settings");
    return { status: "success", message: "Organisation name updated.", name };
  } catch {
    return { status: "error", message: "Could not save the organisation name. Please try again." };
  }
}

export async function renamePlatformOrganizationAction(_state: OrganizationNameState, formData: FormData): Promise<OrganizationNameState> {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], { redirectTo: "/dashboard" });
  const orgId = formData.get("orgId");
  if (typeof orgId !== "string" || !orgId.trim()) return { status: "error", message: "Choose an organisation to edit." };
  return saveName(orgId.trim(), session.userId, formData);
}

export async function renameCurrentOrganizationAction(_state: OrganizationNameState, formData: FormData): Promise<OrganizationNameState> {
  const session = await requireUserSession();
  const orgId = await requireCurrentOrgId();
  const membership = await requireOrgAccess(orgId);
  if (!["ADMIN", "MANAGER"].includes(membership.role)) throw new Error("Forbidden");
  return saveName(orgId, session.userId, formData);
}
