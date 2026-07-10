"use server";

import { prisma } from "@/lib/prisma";
import { getTenantContext } from "./context";
import { getTenantBeforeState, revalidateTenantPages } from "./tenant-state";

export async function restoreTenant(formData: FormData) {
  const tenantId = String(formData.get("tenantId") || "").trim();
  const reason = String(formData.get("reason") || "").trim() || null;

  if (!tenantId) {
    throw new Error("Tenant ID is required.");
  }

  const { orgId, actorUserId, tenant, activeLease } =
    await getTenantContext(tenantId);
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
          tenantStatus:
            tenant.status === "BLACKLISTED" ? "BLACKLISTED" : "INACTIVE",
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