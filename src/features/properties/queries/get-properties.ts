import { prisma } from "@/lib/prisma";
import { requireCurrentOrgId } from "@/lib/auth/org";

export async function getProperties() {
  const orgId = await requireCurrentOrgId();

  const properties = await prisma.property.findMany({
    where: {
      orgId,
      deletedAt: null,
      isActive: true,
    },
    include: {
      units: {
        where: {
          deletedAt: null,
          isActive: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return properties.map((property) => {
    const occupiedUnits = property.units.filter(
      (unit) => unit.status === "OCCUPIED"
    ).length;

    const vacantUnits = property.units.filter(
      (unit) => unit.status === "VACANT"
    ).length;

    const monthlyRentTotal = property.units.reduce(
      (sum, unit) => sum + Number(unit.rentAmount),
      0
    );

    return {
      id: property.id,
      name: property.name,
      location: property.location,
      address: property.address,
      occupiedUnits,
      vacantUnits,
      monthlyRentTotal,
      totalUnits: property.units.length,
    };
  });
}