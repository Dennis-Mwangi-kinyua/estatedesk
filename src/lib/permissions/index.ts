import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";

export type AppPermission =
  | "properties.read"
  | "properties.write"
  | "units.read"
  | "units.write"
  | "tenants.read"
  | "tenants.write"
  | "leases.read"
  | "leases.write"
  | "payments.read"
  | "payments.write"
  | "charges.read"
  | "charges.write"
  | "issues.read"
  | "issues.write"
  | "platform.read"
  | "platform.write";

const rolePermissionMap: Record<string, AppPermission[]> = {
  OWNER: [
    "properties.read",
    "properties.write",
    "units.read",
    "units.write",
    "tenants.read",
    "tenants.write",
    "leases.read",
    "leases.write",
    "payments.read",
    "payments.write",
    "charges.read",
    "charges.write",
    "issues.read",
    "issues.write",
    "platform.read",
  ],
  ADMIN: [
    "properties.read",
    "properties.write",
    "units.read",
    "units.write",
    "tenants.read",
    "tenants.write",
    "leases.read",
    "leases.write",
    "payments.read",
    "payments.write",
    "charges.read",
    "charges.write",
    "issues.read",
    "issues.write",
  ],
  MANAGER: [
    "properties.read",
    "units.read",
    "units.write",
    "tenants.read",
    "tenants.write",
    "leases.read",
    "leases.write",
    "payments.read",
    "charges.read",
    "issues.read",
    "issues.write",
  ],
};

export async function hasPermission(permission: AppPermission, orgId?: string) {
  const user = await requireUser();

  const membership = await prisma.membership.findFirst({
    where: {
      userId: user.id,
      ...(orgId ? { orgId } : {}),
      org: {
        deletedAt: null,
      },
      user: {
        deletedAt: null,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      role: true,
    },
  });

  if (!membership) return false;

  return (rolePermissionMap[membership.role] ?? []).includes(permission);
}

export async function requirePermission(permission: AppPermission, orgId?: string) {
  const allowed = await hasPermission(permission, orgId);

  if (!allowed) {
    throw new Error("Forbidden");
  }
}