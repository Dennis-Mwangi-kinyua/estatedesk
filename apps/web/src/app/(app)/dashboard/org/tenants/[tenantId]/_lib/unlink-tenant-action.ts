"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePublicVacancies } from "@/lib/public-vacancy-cache";
import { getTenantContext } from "./context";
import { getTenantBeforeState, revalidateTenantPages } from "./tenant-state";

export async function unlinkTenantFromUnit(formData: FormData) {
  const tenantId = String(formData.get("tenantId") || "").trim();
  const reason = String(formData.get("reason") || "").trim() || null;

  if (!tenantId) {
    throw new Error("Tenant ID is required.");
  }

  const { orgId, actorUserId, tenant, activeLease } =
    await getTenantContext(tenantId);

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
  revalidatePublicVacancies();
}