import "server-only";

import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { prisma } from "@/lib/prisma";
import type { AssignmentTarget } from "@/features/staff/components/_lib/types";

export async function getCaretakerAssignmentTargets(
  orgId: string,
): Promise<AssignmentTarget[]> {
  const [properties, buildings] = await retryTransientDatabaseOperation(
    () =>
      Promise.all([
    prisma.property.findMany({
      where: {
        orgId,
        deletedAt: null,
        isActive: true,
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        location: true,
      },
    }),
    prisma.building.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        property: {
          orgId,
          deletedAt: null,
          isActive: true,
        },
      },
      orderBy: [{ property: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        property: {
          select: {
            name: true,
          },
        },
      },
    }),
      ]),
    { label: "getCaretakerAssignmentTargets" },
  );

  const propertyTargets: AssignmentTarget[] = properties.map((property) => ({
    id: property.id,
    type: "PROPERTY",
    label: `Property · ${property.name}${
      property.location ? ` (${property.location})` : ""
    }`,
    searchText: `property ${property.name} ${property.location ?? ""}`,
  }));

  const buildingTargets: AssignmentTarget[] = buildings.map((building) => ({
    id: building.id,
    type: "BUILDING",
    label: `Apartment · ${building.property.name} · ${building.name}`,
    searchText: `apartment block building ${building.property.name} ${building.name}`,
  }));

  return [...propertyTargets, ...buildingTargets];
}