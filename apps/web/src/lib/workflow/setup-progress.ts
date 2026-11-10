export type SetupCounts = {
  properties: number;
  buildings: number;
  units: number;
  tenants: number;
  leases: number;
  rentCharges: number;
  meterReadings: number;
  tenantLogins: number;
  staffMemberships: number;
  invitations: number;
};

export type SetupStep = {
  id: string;
  title: string;
  detail: string;
  href: string;
  action: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  done: boolean;
};

export function buildSetupSteps(counts: SetupCounts, unitId: string | null, options?: { free?: boolean }): { complete: boolean; steps: SetupStep[] } {
  const tenantHref = unitId ? `/dashboard/org/tenants/new?unitId=${encodeURIComponent(unitId)}` : "/dashboard/org/tenants/new";
  const portfolioReady = counts.properties > 0 && counts.units > 0;
  const occupancyReady = counts.tenants > 0 && counts.leases > 0;
  const billed = counts.rentCharges > 0;
  const teamReady = counts.tenantLogins > 0 && (counts.staffMemberships > 1 || counts.invitations > 0);

  return {
    complete: billed,
    steps: [
      {
        id: "portfolio",
        title: "Property and units",
        detail: portfolioReady
          ? `${counts.properties} properties · ${counts.buildings} buildings · ${counts.units} units`
          : "Add a property, its building, and at least one unit. A spreadsheet import is available when the portfolio is already listed.",
        href: "/dashboard/org/properties/new",
        action: portfolioReady ? "Review properties" : "Add a property",
        secondaryHref: "/dashboard/org/imports",
        secondaryLabel: "Import a spreadsheet",
        done: portfolioReady,
      },
      {
        id: "occupancy",
        title: "Tenant and lease",
        detail: occupancyReady
          ? `${counts.tenants} tenants · ${counts.leases} leases`
          : "Place one tenant on a unit and record the lease. The unit you just added is selected when it is still vacant.",
        href: tenantHref,
        action: occupancyReady ? "Review tenants" : "Add a tenant",
        done: occupancyReady,
      },
      {
        id: "billing",
        title: "First bill",
        detail: billed
          ? "A rent charge is on the books. Open the month to approve a meter reading when the unit has water."
          : counts.meterReadings > 0
            ? "A meter reading is in. Issue the rent charge so the month can close from one bill."
            : "Issue the rent charge for the lease. If the unit has a meter, the same bill is where the reading is approved.",
        href: "/dashboard/org/charges/bills",
        action: billed ? "Open this month" : "Issue this month",
        done: billed,
      },
      {
        id: "team",
        title: "Tenant login and one teammate",
        detail: teamReady
          ? "A tenant can sign in, and another person has been invited or added."
          : options?.free
            ? "The tenant form creates their login. Invite one office user so the bill is not only yours."
            : "The tenant form creates their login. Invite one office or caretaker user so the queue is not only yours.",
        href: counts.tenantLogins > 0 ? "/dashboard/org/staff" : tenantHref,
        action: counts.tenantLogins > 0 ? "Invite a teammate" : "Create the tenant login",
        secondaryHref: "/dashboard/org/staff",
        secondaryLabel: "Open staff",
        done: teamReady,
      },
    ],
  };
}
