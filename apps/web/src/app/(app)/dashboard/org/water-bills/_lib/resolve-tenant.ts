/**
 * Resolve the tenant who should appear on a meter reading card/detail.
 *
 * Prefer the water bill created for this unit+period (set when the caretaker
 * submitted the reading). Fall back to leases on the unit — not only ACTIVE,
 * in case status labels lag occupancy.
 */
export type ResolvedTenant = {
  fullName: string;
  phone: string | null;
  source: "water_bill" | "active_lease" | "lease";
};

type LeaseLike = {
  status: string;
  deletedAt?: Date | null;
  startDate?: Date | null;
  tenant: {
    fullName: string;
    phone?: string | null;
    status?: string | null;
    deletedAt?: Date | null;
  } | null;
};

type WaterBillLike = {
  period: string;
  tenant: {
    fullName: string;
    phone?: string | null;
    status?: string | null;
    deletedAt?: Date | null;
  } | null;
};

function isUsableTenant(
  tenant: {
    fullName?: string | null;
    status?: string | null;
    deletedAt?: Date | null;
  } | null | undefined,
): tenant is { fullName: string; phone?: string | null } {
  if (!tenant?.fullName?.trim()) return false;
  if (tenant.deletedAt) return false;
  if (tenant.status && tenant.status === "BLACKLISTED") return false;
  // INACTIVE / ACTIVE both allowed for display if they still have a lease/bill
  return true;
}

export function resolveReadingTenant(input: {
  period: string;
  waterBills?: WaterBillLike[] | null;
  leases?: LeaseLike[] | null;
}): ResolvedTenant | null {
  const bills = input.waterBills ?? [];
  const forPeriod = bills.find((bill) => bill.period === input.period);
  if (isUsableTenant(forPeriod?.tenant)) {
    return {
      fullName: forPeriod.tenant.fullName.trim(),
      phone: forPeriod.tenant.phone ?? null,
      source: "water_bill",
    };
  }

  const leases = (input.leases ?? []).filter(
    (lease) => !lease.deletedAt && isUsableTenant(lease.tenant),
  );

  const active = leases.find((lease) => lease.status === "ACTIVE");
  if (active?.tenant) {
    return {
      fullName: active.tenant.fullName.trim(),
      phone: active.tenant.phone ?? null,
      source: "active_lease",
    };
  }

  // Prefer most recent non-cancelled lease
  const preferred = [...leases]
    .filter((lease) => !["CANCELLED", "TERMINATED"].includes(lease.status))
    .sort((a, b) => {
      const aTime = a.startDate ? new Date(a.startDate).getTime() : 0;
      const bTime = b.startDate ? new Date(b.startDate).getTime() : 0;
      return bTime - aTime;
    })[0];

  if (preferred?.tenant) {
    return {
      fullName: preferred.tenant.fullName.trim(),
      phone: preferred.tenant.phone ?? null,
      source: "lease",
    };
  }

  return null;
}

export function formatResolvedTenantLabel(tenant: ResolvedTenant | null) {
  if (!tenant) return "No tenant on file";
  return tenant.phone ? `${tenant.fullName} · ${tenant.phone}` : tenant.fullName;
}
