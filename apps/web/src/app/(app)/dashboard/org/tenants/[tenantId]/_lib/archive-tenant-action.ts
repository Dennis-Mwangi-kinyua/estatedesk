"use server";

import { prisma } from "@/lib/prisma";
import { getTenantContext } from "./context";
import { getTenantBeforeState, revalidateTenantPages } from "./tenant-state";

export async function archiveTenant(formData: FormData) {
  const tenantId = String(formData.get("tenantId") || "").trim();
  const reason = String(formData.get("reason") || "").trim() || null;

  if (!tenantId) {
    throw new Error("Tenant ID is required.");
  }

  const { orgId, actorUserId, tenant, activeLease } =
    await getTenantContext(tenantId);
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