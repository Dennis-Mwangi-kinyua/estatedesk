import { LeaseStatus, TicketStatus, UnitStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PropertyUnitItem = {
  id: string;
  houseNo: string;
  type: string;
  status: string;
  rentAmount: number;
  activeLeaseCount: number;
  tenantName: string | null;
};

export type PropertyIssueItem = {
  id: string;
  title: string;
  priority: string;
  status: string;
  createdAt: Date;
  unitLabel: string | null;
};

export type PropertyCaretakerItem = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
  active: boolean;
};

export type PropertyDetails = {
  id: string;
  name: string;
  type: string;
  address: string | null;
  location: string | null;
  notes: string | null;
  isActive: boolean;
  waterRatePerUnit: number | null;
  waterFixedCharge: number | null;
  createdAt: Date;
  buildingsCount: number;
  units: PropertyUnitItem[];
  issues: PropertyIssueItem[];
  caretakers: PropertyCaretakerItem[];
  stats: {
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
    reservedUnits: number;
    maintenanceUnits: number;
    activeTenants: number;
    monthlyRentPotential: number;
    openIssues: number;
  };
};

export async function getPropertyDetails(
  propertyId: string
): Promise<PropertyDetails | null> {
  const property = await prisma.property.findUnique({
    where: {
      id: propertyId,
    },
    include: {
      buildings: {
        select: {
          id: true,
        },
      },
      units: {
        orderBy: {
          houseNo: "asc",
        },
        select: {
          id: true,
          houseNo: true,
          type: true,
          status: true,
          rentAmount: true,
          leases: {
            where: {
              status: LeaseStatus.ACTIVE,
            },
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
              tenant: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
      },
      issues: {
        where: {
          status: {
            in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS],
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
        select: {
          id: true,
          title: true,
          priority: true,
          status: true,
          createdAt: true,
          unit: {
            select: {
              houseNo: true,
            },
          },
        },
      },
      caretakerAssignments: {
        where: {
          active: true,
        },
        orderBy: [{ isPrimary: "desc" }, { assignedAt: "desc" }],
        select: {
          id: true,
          isPrimary: true,
          active: true,
          caretaker: {
            select: {
              fullName: true,
              phone: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!property) {
    return null;
  }

  const totalUnits = property.units.length;

  const occupiedUnits = property.units.filter((unit) => {
    return unit.status === UnitStatus.OCCUPIED || unit.leases.length > 0;
  }).length;

  const vacantUnits = property.units.filter(
    (unit) => unit.status === UnitStatus.VACANT
  ).length;

  const reservedUnits = property.units.filter(
    (unit) => unit.status === UnitStatus.RESERVED
  ).length;

  const maintenanceUnits = property.units.filter(
    (unit) => unit.status === UnitStatus.UNDER_MAINTENANCE
  ).length;

  const activeTenants = property.units.reduce((sum, unit) => {
    return sum + unit.leases.length;
  }, 0);

  const monthlyRentPotential = property.units.reduce((sum, unit) => {
    return sum + Number(unit.rentAmount);
  }, 0);

  const openIssues = property.issues.length;

  return {
    id: property.id,
    name: property.name,
    type: property.type,
    address: property.address,
    location: property.location,
    notes: property.notes,
    isActive: property.isActive,
    waterRatePerUnit:
      property.waterRatePerUnit !== null
        ? Number(property.waterRatePerUnit)
        : null,
    waterFixedCharge:
      property.waterFixedCharge !== null
        ? Number(property.waterFixedCharge)
        : null,
    createdAt: property.createdAt,
    buildingsCount: property.buildings.length,
    units: property.units.map((unit) => ({
      id: unit.id,
      houseNo: unit.houseNo,
      type: unit.type,
      status: unit.status,
      rentAmount: Number(unit.rentAmount),
      activeLeaseCount: unit.leases.length,
      tenantName: unit.leases[0]?.tenant.fullName ?? null,
    })),
    issues: property.issues.map((issue) => ({
      id: issue.id,
      title: issue.title,
      priority: issue.priority,
      status: issue.status,
      createdAt: issue.createdAt,
      unitLabel: issue.unit?.houseNo ?? null,
    })),
    caretakers: property.caretakerAssignments.map((assignment) => ({
      id: assignment.id,
      fullName: assignment.caretaker.fullName,
      phone: assignment.caretaker.phone ?? null,
      email: assignment.caretaker.email ?? null,
      isPrimary: assignment.isPrimary,
      active: assignment.active,
    })),
    stats: {
      totalUnits,
      occupiedUnits,
      vacantUnits,
      reservedUnits,
      maintenanceUnits,
      activeTenants,
      monthlyRentPotential,
      openIssues,
    },
  };
}