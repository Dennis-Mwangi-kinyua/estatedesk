"use server";

import { prisma } from "@/lib/prisma";
import { getTenantContext } from "./context";
import { getTenantBeforeState, revalidateTenantPages } from "./tenant-state";

export async function softDeleteTenant(formData: FormData) {
  const tenantId = String(formData.get("tenantId") || "").trim();
  const reason = String(formData.get("reason") || "").trim() || null;

  if (!tenantId) {
    throw new Error("Tenant ID is required.");
  }

  const { orgId, actorUserId, tenant, activeLease } =
    await getTenantContext(tenantId);

  if (activeLease) {
    throw new Error(
      "Cannot delete tenant with an active lease. Unlink the tenant first.",
    );
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