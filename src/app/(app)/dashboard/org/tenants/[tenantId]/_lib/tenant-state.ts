import { revalidatePath } from "next/cache";

export function getTenantBeforeState(
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

export function revalidateTenantPages(tenantId: string) {
  revalidatePath("/dashboard/org/tenants");
  revalidatePath(`/dashboard/org/tenants/${tenantId}`);
}