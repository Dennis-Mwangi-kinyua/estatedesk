"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/security";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { roleHasOrgPermission } from "@/lib/permissions/role-matrix";
import { requireCurrentOrgId, requireOrgAccess } from "@/lib/auth/org";
import { requireUserSession } from "@/lib/auth/session";

export type OrganizationSlugState = { status: "idle" | "error" | "success"; message?: string; slug?: string };

async function saveSlug(orgId: string, actorUserId: string, formData: FormData): Promise<OrganizationSlugState> {
  const raw = formData.get("organizationSlug");
  const slug = typeof raw === "string" ? raw.trim() : "";
  if (slug.length < 2 || slug.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { status: "error", message: "Use 2–100 lowercase letters or numbers, separated by single hyphens." };
  }
  try {
    const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { id: true, slug: true, deletedAt: true } });
    if (!org || org.deletedAt) return { status: "error", message: "This organisation is no longer available." };
    if (org.slug !== slug) {
      await prisma.organization.update({ where: { id: org.id, deletedAt: null }, data: { slug } });
      await writeAuditLog({ orgId, actorUserId, action: "ORGANIZATION_SLUG_UPDATED", entityType: "Organization", entityId: orgId, beforeState: { slug: org.slug }, afterState: { slug } });
    }
    revalidatePath("/", "layout");
    revalidatePath("/platform/organizations");
    revalidatePath(`/platform/organizations/${org.slug}`);
    revalidatePath(`/platform/organizations/${slug}`);
    revalidatePath("/dashboard/org/settings");
    return { status: "success", message: "Organisation slug updated.", slug };
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return { status: "error", message: "This slug is already in use. Choose another." };
    }
    return { status: "error", message: "Could not save the organisation slug. Please try again." };
  }
}

export async function updatePlatformOrganizationSlugAction(_state: OrganizationSlugState, formData: FormData): Promise<OrganizationSlugState> {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], { redirectTo: "/dashboard" });
  const orgId = formData.get("orgId");
  if (typeof orgId !== "string" || !orgId.trim()) return { status: "error", message: "Choose an organisation to edit." };
  const result = await saveSlug(orgId.trim(), session.userId, formData);
  if (result.status === "success") redirect(`/platform/organizations/${result.slug}`);
  return result;
}

export async function updateCurrentOrganizationSlugAction(_state: OrganizationSlugState, formData: FormData): Promise<OrganizationSlugState> {
  const session = await requireUserSession();
  const orgId = await requireCurrentOrgId();
  const membership = await requireOrgAccess(orgId);
  if (!roleHasOrgPermission(membership.role, "org.settings.manage")) throw new Error("Forbidden");
  return saveSlug(orgId, session.userId, formData);
}
