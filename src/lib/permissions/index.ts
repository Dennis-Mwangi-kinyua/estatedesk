// src/lib/permissions/index.ts
import type { OrgRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";

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

const allPermissions: AppPermission[] = [
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
  "platform.write",
];

const rolePermissionMap: Partial<Record<OrgRole, AppPermission[]>> = {
  LANDLORD: allPermissions,

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
    "platform.read",
    "platform.write",
  ],

  MANAGER: [
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

  OFFICE: [
    "properties.read",
    "units.read",
    "tenants.read",
    "tenants.write",
    "leases.read",
    "charges.read",
    "issues.read",
    "issues.write",
  ],

  ACCOUNTANT: [
    "properties.read",
    "units.read",
    "tenants.read",
    "leases.read",
    "payments.read",
    "payments.write",
    "charges.read",
    "charges.write",
  ],

  CARETAKER: [
    "properties.read",
    "units.read",
    "issues.read",
    "issues.write",
  ],

  TENANT: [
    "properties.read",
    "units.read",
    "leases.read",
    "payments.read",
    "charges.read",
    "issues.read",
    "issues.write",
  ],
};

function getSessionUserId(session: unknown): string {
  const value = session as {
    id?: string;
    userId?: string;
    user?: {
      id?: string;
    };
  };

  const userId = value.userId ?? value.user?.id ?? value.id;

  if (!userId) {
    throw new Error("Authenticated user id not found in session.");
  }

  return userId;
}

export async function hasPermission(
  permission: AppPermission,
  orgId?: string,
): Promise<boolean> {
  const session = await requireUserSession();
  const userId = getSessionUserId(session);

  const membership = await prisma.membership.findFirst({
    where: {
      userId,
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

export async function requirePermission(
  permission: AppPermission,
  orgId?: string,
): Promise<void> {
  const allowed = await hasPermission(permission, orgId);

  if (!allowed) {
    throw new Error("Forbidden");
  }
}