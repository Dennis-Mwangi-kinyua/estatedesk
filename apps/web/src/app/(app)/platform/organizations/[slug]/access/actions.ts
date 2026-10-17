"use server";

import { Prisma } from "@prisma/client";
import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { getRequestAuditMetadata } from "@/lib/audit/security";
import { ORGANIZATION_ROLES, orgRolePolicySchema, readOrgRolePolicies } from "@/lib/permissions/org-role-policy";
import { ORG_PERMISSIONS } from "@/lib/permissions/role-matrix";

export async function saveOrganizationRoleAccess(orgId: string, form: FormData) {
  const actor = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
  const org = await prisma.organization.findFirst({ where: { id: orgId, deletedAt: null }, select: { slug: true } });
  if (!org) throw new Error("Organization not found.");
  const role = String(form.get("role"));
  if (!(ORGANIZATION_ROLES as readonly string[]).includes(role)) throw new Error("Invalid organization role.");
  const typedRole = role as typeof ORGANIZATION_ROLES[number];
  const url = `/platform/organizations/${encodeURIComponent(org.slug)}/access?role=${role}`;
  try {
    const permissions = Object.fromEntries(ORG_PERMISSIONS.flatMap(permission => {
      const decision = String(form.get(`permission:${permission}`) ?? "default");
      if (decision === "default") return [];
      return [[permission, decision]];
    }));
    const policy = orgRolePolicySchema.parse({ permissions, blockedViews: form.getAll("blockedViews") });
    const request = await getRequestAuditMetadata();
    await prisma.$transaction(async tx => {
      // Serialize creation and changes across roles without overwriting another
      // platform administrator's changes to a different role.
      await tx.$queryRaw(Prisma.sql`SELECT id FROM "Organization" WHERE id = ${orgId} FOR UPDATE`);
      const current = await tx.organizationSettings.findUnique({ where: { orgId }, select: { roleAccess: true } });
      const policies = readOrgRolePolicies(current?.roleAccess);
      const before = policies[typedRole] ?? { permissions: {}, blockedViews: [] };
      const revision = createHash("sha256").update(JSON.stringify(before)).digest("hex");
      if (String(form.get("revision")) !== revision) throw new Error("Access changed. Reload before saving.");
      if (form.get("command") === "reset") delete policies[typedRole];
      else policies[typedRole] = policy;
      const roleAccess = JSON.parse(JSON.stringify(policies)) as Prisma.InputJsonObject;
      await tx.organizationSettings.upsert({ where: { orgId }, create: { orgId, roleAccess }, update: { roleAccess } });
      await tx.auditLog.create({ data: {
        orgId, actorUserId: actor.userId, action: "ORG_ROLE_ACCESS_UPDATED", entityType: "OrganizationRole", entityId: `${orgId}:${role}`,
        ip: request.ip, userAgent: request.userAgent,
        beforeState: JSON.parse(JSON.stringify(before)),
        afterState: JSON.parse(JSON.stringify(policies[typedRole] ?? { permissions: {}, blockedViews: [] })),
        metadata: { role, reset: form.get("command") === "reset" },
      } });
    });
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${url}&error=save`);
  }
  revalidatePath("/dashboard", "layout");
  revalidatePath("/platform/organizations", "layout");
  redirect(`${url}&saved=1`);
}
