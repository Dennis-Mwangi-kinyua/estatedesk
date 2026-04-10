"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";

type ManagedRole = "ADMIN" | "MANAGER" | "OFFICE";

function assertCanManageTenant(role: string | null | undefined): asserts role is ManagedRole {
  if (!role || !["ADMIN", "MANAGER", "OFFICE"].includes(role)) {
    throw new Error("You do not have permission to manage tenants.");
  }
}

async function getTenantContext(tenantId: string) {
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
    tenant.leases.find((lease) => String(lease.status).toUpperCase() === "ACTIVE") ?? null;

  return {
    session,
    orgId,
    actorUserId,
    tenant,
    activeLease,
  };
}

function getTenantBeforeState(
  tenant: {
    id: string;
    status: string;
    deletedAt: Date | null;
    archivedAt?: Date | null;
    blacklistedAt?: Date | null;
    blacklistReason?: string | null;
  },
  activeLease: {
    id: string;
    status: string;
    endDate: Date | null;
    unitId: string;
    unit: {
      status: string;
      vacantSince: Date | null;
    };
  } | null,
) {
  return {
    tenantId: tenant.id,
    tenantStatus: tenant.status,
    deletedAt: tenant.deletedAt?.toISOString() ?? null,
    archivedAt: tenant.archivedAt?.toISOString() ?? null,
    blacklistedAt: tenant.blacklistedAt?.toISOString() ?? null,
    blacklistReason: tenant.blacklistReason ?? null,
    activeLease: activeLease
      ? {
          leaseId: activeLease.id,
          status: activeLease.status,
          endDate: activeLease.endDate?.toISOString() ?? null,
          unitId: activeLease.unitId,
          unitStatus: activeLease.unit.status,
          vacantSince: activeLease.unit.vacantSince?.toISOString() ?? null,
        }
      : null,
  };
}

function revalidateTenantPages(tenantId: string) {
  revalidatePath("/dashboard/org/tenants");
  revalidatePath(`/dashboard/org/tenants/${tenantId}`);
}

export async function unlinkTenantFromUnit(formData: FormData) {
  const tenantId = String(formData.get("tenantId") || "").trim();
  const reason = String(formData.get("reason") || "").trim() || null;

  if (!tenantId) {
    throw new Error("Tenant ID is required.");
  }

  const { orgId, actorUserId, tenant, activeLease } = await getTenantContext(tenantId);

  if (!activeLease) {
    throw new Error("This tenant has no active lease to unlink.");
  }

  const beforeState = getTenantBeforeState(tenant, activeLease);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.lease.update({
      where: { id: activeLease.id },
      data: {
        status: "TERMINATED",
        endDate: now,
        notes: reason
          ? `${activeLease.notes ? `${activeLease.notes}\n\n` : ""}Unlinked from unit: ${reason}`
          : activeLease.notes,
      },
    });

    await tx.unit.update({
      where: { id: activeLease.unitId },
      data: {
        status: "VACANT",
        vacantSince: now,
      },
    });

    await tx.tenantActionLog.create({
      data: {
        orgId,
        tenantId: tenant.id,
        leaseId: activeLease.id,
        unitId: activeLease.unitId,
        actorUserId,
        action: "UNLINKED",
        reason,
        notes: "Tenant unlinked from active unit.",
        metadata: {
          source: "tenant-details-page",
        },
      },
    });

    await tx.auditLog.create({
      data: {
        orgId,
        actorUserId,
        action: "TENANT_UNLINKED_FROM_UNIT",
        entityType: "Tenant",
        entityId: tenant.id,
        metadata: {
          tenantId: tenant.id,
          leaseId: activeLease.id,
          unitId: activeLease.unitId,
          reason,
        },
        beforeState,
        afterState: {
          tenantId: tenant.id,
          tenantStatus: tenant.status,
          deletedAt: tenant.deletedAt?.toISOString() ?? null,
          archivedAt: tenant.archivedAt?.toISOString() ?? null,
          blacklistedAt: tenant.blacklistedAt?.toISOString() ?? null,
          blacklistReason: tenant.blacklistReason ?? null,
          activeLease: {
            leaseId: activeLease.id,
            status: "TERMINATED",
            endDate: now.toISOString(),
            unitId: activeLease.unitId,
            unitStatus: "VACANT",
            vacantSince: now.toISOString(),
          },
        },
      },
    });
  });

  revalidateTenantPages(tenantId);
}

export async function blacklistTenant(formData: FormData) {
  const tenantId = String(formData.get("tenantId") || "").trim();
  const reason = String(formData.get("reason") || "").trim() || null;

  if (!tenantId) {
    throw new Error("Tenant ID is required.");
  }

  const { orgId, actorUserId, tenant, activeLease } = await getTenantContext(tenantId);
  const beforeState = getTenantBeforeState(tenant, activeLease);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.tenant.update({
      where: { id: tenant.id },
      data: {
        status: "BLACKLISTED",
        blacklistedAt: now,
        blacklistReason: reason,
        archivedAt: tenant.archivedAt ?? null,
      },
    });

    await tx.tenantActionLog.create({
      data: {
        orgId,
        tenantId: tenant.id,
        leaseId: activeLease?.id ?? null,
        unitId: activeLease?.unitId ?? null,
        actorUserId,
        action: "BLACKLISTED",
        reason,
        notes: "Tenant marked as blacklisted.",
        metadata: {
          source: "tenant-details-page",
        },
      },
    });

    await tx.auditLog.create({
      data: {
        orgId,
        actorUserId,
        action: "TENANT_BLACKLISTED",
        entityType: "Tenant",
        entityId: tenant.id,
        metadata: {
          tenantId: tenant.id,
          leaseId: activeLease?.id ?? null,
          unitId: activeLease?.unitId ?? null,
          reason,
        },
        beforeState,
        afterState: {
          tenantId: tenant.id,
          tenantStatus: "BLACKLISTED",
          deletedAt: tenant.deletedAt?.toISOString() ?? null,
          archivedAt: tenant.archivedAt?.toISOString() ?? null,
          blacklistedAt: now.toISOString(),
          blacklistReason: reason,
          activeLease: activeLease
            ? {
                leaseId: activeLease.id,
                status: activeLease.status,
                endDate: activeLease.endDate?.toISOString() ?? null,
                unitId: activeLease.unitId,
                unitStatus: activeLease.unit.status,
                vacantSince: activeLease.unit.vacantSince?.toISOString() ?? null,
              }
            : null,
        },
      },
    });
  });

  revalidateTenantPages(tenantId);
}

export async function archiveTenant(formData: FormData) {
  const tenantId = String(formData.get("tenantId") || "").trim();
  const reason = String(formData.get("reason") || "").trim() || null;

  if (!tenantId) {
    throw new Error("Tenant ID is required.");
  }

  const { orgId, actorUserId, tenant, activeLease } = await getTenantContext(tenantId);
  const beforeState = getTenantBeforeState(tenant, activeLease);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.tenant.update({
      where: { id: tenant.id },
      data: {
        status: "INACTIVE",
        archivedAt: now,
      },
    });

    await tx.tenantActionLog.create({
      data: {
        orgId,
        tenantId: tenant.id,
        leaseId: activeLease?.id ?? null,
        unitId: activeLease?.unitId ?? null,
        actorUserId,
        action: "ARCHIVED",
        reason,
        notes: "Tenant archived.",
        metadata: {
          source: "tenant-details-page",
        },
      },
    });

    await tx.auditLog.create({
      data: {
        orgId,
        actorUserId,
        action: "TENANT_ARCHIVED",
        entityType: "Tenant",
        entityId: tenant.id,
        metadata: {
          tenantId: tenant.id,
          leaseId: activeLease?.id ?? null,
          unitId: activeLease?.unitId ?? null,
          reason,
        },
        beforeState,
        afterState: {
          tenantId: tenant.id,
          tenantStatus: "INACTIVE",
          deletedAt: tenant.deletedAt?.toISOString() ?? null,
          archivedAt: now.toISOString(),
          blacklistedAt: tenant.blacklistedAt?.toISOString() ?? null,
          blacklistReason: tenant.blacklistReason ?? null,
          activeLease: activeLease
            ? {
                leaseId: activeLease.id,
                status: activeLease.status,
                endDate: activeLease.endDate?.toISOString() ?? null,
                unitId: activeLease.unitId,
                unitStatus: activeLease.unit.status,
                vacantSince: activeLease.unit.vacantSince?.toISOString() ?? null,
              }
            : null,
        },
      },
    });
  });

  revalidateTenantPages(tenantId);
}

export async function softDeleteTenant(formData: FormData) {
  const tenantId = String(formData.get("tenantId") || "").trim();
  const reason = String(formData.get("reason") || "").trim() || null;

  if (!tenantId) {
    throw new Error("Tenant ID is required.");
  }

  const { orgId, actorUserId, tenant, activeLease } = await getTenantContext(tenantId);

  if (activeLease) {
    throw new Error("Cannot delete tenant with an active lease. Unlink the tenant first.");
  }

  const beforeState = getTenantBeforeState(tenant, activeLease);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.tenant.update({
      where: { id: tenant.id },
      data: {
        deletedAt: now,
      },
    });

    await tx.tenantActionLog.create({
      data: {
        orgId,
        tenantId: tenant.id,
        actorUserId,
        action: "SOFT_DELETED",
        reason,
        notes: "Tenant soft deleted.",
        metadata: {
          source: "tenant-details-page",
        },
      },
    });

    await tx.auditLog.create({
      data: {
        orgId,
        actorUserId,
        action: "TENANT_SOFT_DELETED",
        entityType: "Tenant",
        entityId: tenant.id,
        metadata: {
          tenantId: tenant.id,
          reason,
        },
        beforeState,
        afterState: {
          tenantId: tenant.id,
          tenantStatus: tenant.status,
          deletedAt: now.toISOString(),
          archivedAt: tenant.archivedAt?.toISOString() ?? null,
          blacklistedAt: tenant.blacklistedAt?.toISOString() ?? null,
          blacklistReason: tenant.blacklistReason ?? null,
          activeLease: null,
        },
      },
    });
  });

  revalidateTenantPages(tenantId);
}

export async function restoreTenant(formData: FormData) {
  const tenantId = String(formData.get("tenantId") || "").trim();
  const reason = String(formData.get("reason") || "").trim() || null;

  if (!tenantId) {
    throw new Error("Tenant ID is required.");
  }

  const { orgId, actorUserId, tenant, activeLease } = await getTenantContext(tenantId);
  const beforeState = getTenantBeforeState(tenant, activeLease);

  await prisma.$transaction(async (tx) => {
    await tx.tenant.update({
      where: { id: tenant.id },
      data: {
        deletedAt: null,
        status: tenant.status === "BLACKLISTED" ? "BLACKLISTED" : "INACTIVE",
      },
    });

    await tx.tenantActionLog.create({
      data: {
        orgId,
        tenantId: tenant.id,
        leaseId: activeLease?.id ?? null,
        unitId: activeLease?.unitId ?? null,
        actorUserId,
        action: "RESTORED",
        reason,
        notes: "Tenant restored from soft delete.",
        metadata: {
          source: "tenant-details-page",
        },
      },
    });

    await tx.auditLog.create({
      data: {
        orgId,
        actorUserId,
        action: "TENANT_RESTORED",
        entityType: "Tenant",
        entityId: tenant.id,
        metadata: {
          tenantId: tenant.id,
          reason,
        },
        beforeState,
        afterState: {
          tenantId: tenant.id,
          tenantStatus: tenant.status === "BLACKLISTED" ? "BLACKLISTED" : "INACTIVE",
          deletedAt: null,
          archivedAt: tenant.archivedAt?.toISOString() ?? null,
          blacklistedAt: tenant.blacklistedAt?.toISOString() ?? null,
          blacklistReason: tenant.blacklistReason ?? null,
          activeLease: activeLease
            ? {
                leaseId: activeLease.id,
                status: activeLease.status,
                endDate: activeLease.endDate?.toISOString() ?? null,
                unitId: activeLease.unitId,
                unitStatus: activeLease.unit.status,
                vacantSince: activeLease.unit.vacantSince?.toISOString() ?? null,
              }
            : null,
        },
      },
    });
  });

  revalidateTenantPages(tenantId);
}