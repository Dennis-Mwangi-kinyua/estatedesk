import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import type { ManagedRole } from "./types";

export function assertCanManageTenant(
  role: string | null | undefined,
): asserts role is ManagedRole {
  if (!role || !["ADMIN", "MANAGER", "OFFICE"].includes(role)) {
    throw new Error("You do not have permission to manage tenants.");
  }
}

export async function getTenantContext(tenantId: string) {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    throw new Error("No active organisation found.");
  }

  assertCanManageTenant(session.activeOrgRole);

  const orgId = String(session.activeOrgId).trim();
  const actorUserId = String(session.userId).trim();

  const tenant = await prisma.tenant.findFirst({
    where: {
      id: tenantId,
      orgId,
    },
    include: {
      leases: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          unit: true,
        },
      },
    },
  });

  if (!tenant) {
    throw new Error("Tenant not found.");
  }

  const activeLease =
    tenant.leases.find(
      (lease) => String(lease.status).toUpperCase() === "ACTIVE",
    ) ?? null;

  return {
    session,
    orgId,
    actorUserId,
    tenant,
    activeLease,
  };
}