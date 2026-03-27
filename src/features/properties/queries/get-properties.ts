import { LeaseStatus, UnitStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PropertyCardItem = {
  id: string;
  name: string;
  address: string | null;
  location: string | null;
  type: string;
  status: string;
  unitCount: number;
  occupiedUnits: number;
  vacantUnits: number;
  activeTenants: number;
  monthlyRentTotal: number;
};

export async function getProperties(): Promise<PropertyCardItem[]> {
  const properties = await prisma.property.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      units: {
        select: {
          id: true,
          status: true,
          rentAmount: true,
          leases: {
            where: {
              status: LeaseStatus.ACTIVE,
            },
            select: {
              id: true,
              tenantId: true,
            },
          },
        },
      },
    },
  });

  return properties.map((property) => {
    const unitCount = property.units.length;

    const occupiedUnits = property.units.filter((unit) => {
      const hasActiveLease = unit.leases.length > 0;
      return hasActiveLease || unit.status === UnitStatus.OCCUPIED;
    }).length;

    const vacantUnits = property.units.filter(
      (unit) => unit.status === UnitStatus.VACANT
    ).length;

    const activeTenants = property.units.reduce((sum, unit) => {
      return sum + unit.leases.length;
    }, 0);

    const monthlyRentTotal = property.units.reduce((sum, unit) => {
      return sum + Number(unit.rentAmount ?? 0);
    }, 0);

    return {
      id: property.id,
      name: property.name,
      address: property.address ?? null,
      location: property.location ?? null,
      type: property.type,
      status: property.isActive ? "ACTIVE" : "INACTIVE",
      unitCount,
      occupiedUnits,
      vacantUnits,
      activeTenants,
      monthlyRentTotal,
    };
  });
}