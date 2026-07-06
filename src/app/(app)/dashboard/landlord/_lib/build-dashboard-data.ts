import { getCurrentPeriod } from "@/lib/ledger";
import { getPortfolioHealthTone } from "@/app/(app)/dashboard/landlord/_lib/helpers";
import type {
  LandlordDashboardData,
  LandlordProperty,
} from "@/app/(app)/dashboard/landlord/_lib/types";

export type LandlordProfileForBuild = {
  displayName: string;
  assignments: Array<{
    property: {
      id: string;
      name: string;
      location: string | null;
      address: string | null;
      units: Array<{
        id: string;
        houseNo: string;
        rentAmount: unknown;
        status: string;
        leases: Array<{
          tenant: { fullName: string };
          rentCharges: Array<{
            amountDue: unknown;
            amountPaid: unknown;
            balance: unknown;
            status: string;
          }>;
        }>;
      }>;
    } | null;
    unit: {
      id: string;
      houseNo: string;
      rentAmount: unknown;
      status: string;
      property: {
        id: string;
        name: string;
        location: string | null;
        address: string | null;
      };
      leases: Array<{
        tenant: { fullName: string };
        rentCharges: Array<{
          amountDue: unknown;
          amountPaid: unknown;
          balance: unknown;
          status: string;
        }>;
      }>;
    } | null;
  }>;
};

export function buildPropertiesFromProfile(
  profile: LandlordProfileForBuild,
): LandlordProperty[] {
  const propertyMap = new Map<string, LandlordProperty>();

  for (const assignment of profile.assignments) {
    if (assignment.property) {
      propertyMap.set(assignment.property.id, {
        id: assignment.property.id,
        name: assignment.property.name,
        location: assignment.property.location,
        address: assignment.property.address,
        units: assignment.property.units.map((unit) => ({
          amountDue:
            unit.leases[0]?.rentCharges[0]?.amountDue ?? unit.rentAmount,
          amountPaid: unit.leases[0]?.rentCharges[0]?.amountPaid ?? 0,
          balance: unit.leases[0]?.rentCharges[0]?.balance ?? unit.rentAmount,
          id: unit.id,
          houseNo: unit.houseNo,
          paymentStatus:
            unit.leases[0]?.rentCharges[0]?.status ??
            (unit.leases[0] ? "UNPAID" : "NO_TENANT"),
          rentAmount: unit.rentAmount,
          status: unit.status,
          tenantName: unit.leases[0]?.tenant.fullName ?? null,
        })),
      });
    }

    if (assignment.unit) {
      const property = assignment.unit.property;
      const existing =
        propertyMap.get(property.id) ??
        {
          id: property.id,
          name: property.name,
          location: property.location,
          address: property.address,
          units: [],
        };

      if (!existing.units.some((unit) => unit.id === assignment.unit?.id)) {
        existing.units.push({
          id: assignment.unit.id,
          amountDue:
            assignment.unit.leases[0]?.rentCharges[0]?.amountDue ??
            assignment.unit.rentAmount,
          amountPaid:
            assignment.unit.leases[0]?.rentCharges[0]?.amountPaid ?? 0,
          balance:
            assignment.unit.leases[0]?.rentCharges[0]?.balance ??
            assignment.unit.rentAmount,
          houseNo: assignment.unit.houseNo,
          paymentStatus:
            assignment.unit.leases[0]?.rentCharges[0]?.status ??
            (assignment.unit.leases[0] ? "UNPAID" : "NO_TENANT"),
          rentAmount: assignment.unit.rentAmount,
          status: assignment.unit.status,
          tenantName: assignment.unit.leases[0]?.tenant.fullName ?? null,
        });
      }

      propertyMap.set(property.id, existing);
    }
  }

  return Array.from(propertyMap.values());
}

export function buildDashboardData(
  profile: LandlordProfileForBuild,
  properties: LandlordProperty[],
): LandlordDashboardData {
  const currentPeriod = getCurrentPeriod();
  const units = properties.flatMap((property) => property.units);
  const occupiedUnits = units.filter((unit) => unit.status === "OCCUPIED").length;
  const vacantUnits = units.filter((unit) => unit.status === "VACANT").length;
  const tenantNames = Array.from(
    new Set(units.map((unit) => unit.tenantName).filter(Boolean) as string[]),
  );
  const occupancyRate = units.length ? (occupiedUnits / units.length) * 100 : 0;
  const monthlyRent = units.reduce(
    (total, unit) => total + Number(unit.rentAmount ?? 0),
    0,
  );
  const monthlyAmountDue = units
    .filter((unit) => unit.tenantName)
    .reduce((total, unit) => total + Number(unit.amountDue ?? 0), 0);
  const monthlyAmountPaid = units.reduce(
    (total, unit) => total + Number(unit.amountPaid ?? 0),
    0,
  );
  const monthlyBalance = units.reduce(
    (total, unit) =>
      total + (unit.tenantName ? Number(unit.balance ?? 0) : 0),
    0,
  );
  const collectionRate = monthlyAmountDue
    ? (monthlyAmountPaid / monthlyAmountDue) * 100
    : 0;
  const paidUnits = units.filter(
    (unit) => unit.tenantName && Number(unit.balance ?? 0) <= 0,
  );
  const unpaidUnits = units.filter(
    (unit) => unit.tenantName && Number(unit.balance ?? 0) > 0,
  );
  const occupiedRent = units
    .filter((unit) => unit.status === "OCCUPIED")
    .reduce((total, unit) => total + Number(unit.rentAmount ?? 0), 0);
  const vacantRent = units
    .filter((unit) => unit.status === "VACANT")
    .reduce((total, unit) => total + Number(unit.rentAmount ?? 0), 0);
  const averageRent = units.length ? monthlyRent / units.length : 0;
  const strongestProperty = properties
    .map((property) => {
      const propertyRent = property.units.reduce(
        (total, unit) => total + Number(unit.rentAmount ?? 0),
        0,
      );

      return {
        name: property.name,
        rent: propertyRent,
        units: property.units.length,
      };
    })
    .sort((a, b) => b.rent - a.rent)[0];
  const propertyReports = properties.map((property) => {
    const expected = property.units
      .filter((unit) => unit.tenantName)
      .reduce((total, unit) => total + Number(unit.amountDue ?? 0), 0);
    const paid = property.units.reduce(
      (total, unit) => total + Number(unit.amountPaid ?? 0),
      0,
    );
    const balance = property.units.reduce(
      (total, unit) =>
        total + (unit.tenantName ? Number(unit.balance ?? 0) : 0),
      0,
    );
    const paidCount = property.units.filter(
      (unit) => unit.tenantName && Number(unit.balance ?? 0) <= 0,
    ).length;
    const unpaidCount = property.units.filter(
      (unit) => unit.tenantName && Number(unit.balance ?? 0) > 0,
    ).length;

    return {
      id: property.id,
      name: property.name,
      expected,
      paid,
      balance,
      paidCount,
      unpaidCount,
    };
  });
  const atRiskUnits = [...unpaidUnits]
    .sort((a, b) => Number(b.balance ?? 0) - Number(a.balance ?? 0))
    .slice(0, 5);
  const vacantUnitQueue = units
    .filter((unit) => unit.status === "VACANT")
    .slice(0, 5);
  const collectionGap = Math.max(monthlyAmountDue - monthlyAmountPaid, 0);
  const portfolioHealth =
    collectionRate >= 95 && vacantUnits === 0
      ? "Healthy"
      : collectionRate >= 80
        ? "Watch"
        : "Needs attention";

  return {
    displayName: profile.displayName,
    currentPeriod,
    properties,
    units,
    occupiedUnits,
    vacantUnits,
    tenantNames,
    occupancyRate,
    monthlyRent,
    monthlyAmountDue,
    monthlyAmountPaid,
    monthlyBalance,
    collectionRate,
    paidUnits,
    unpaidUnits,
    occupiedRent,
    vacantRent,
    averageRent,
    strongestProperty,
    propertyReports,
    atRiskUnits,
    vacantUnitQueue,
    collectionGap,
    portfolioHealth,
    healthTone: getPortfolioHealthTone(portfolioHealth),
  };
}