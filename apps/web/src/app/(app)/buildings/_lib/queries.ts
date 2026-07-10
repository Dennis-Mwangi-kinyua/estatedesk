import { Prisma } from "@prisma/client";
import { getPagination } from "@/lib/db/pagination";
import { prisma } from "@/lib/prisma";
import { PAGE_SIZE } from "./types";
import type { SessionWithScope } from "./types";

function buildBuildingsWhere(session: SessionWithScope, query: string) {
  const scopeWhere: Prisma.BuildingWhereInput =
    session.membershipScope?.scopeType === "PROPERTY"
      ? {
          propertyId: session.membershipScope.scopeId,
        }
      : session.membershipScope?.scopeType === "BUILDING"
        ? {
            id: session.membershipScope.scopeId,
          }
        : session.membershipScope?.scopeType === "UNIT"
          ? {
              units: {
                some: {
                  id: session.membershipScope.scopeId,
                  deletedAt: null,
                },
              },
            }
          : {};

  const searchWhere: Prisma.BuildingWhereInput = query
    ? {
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            notes: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            property: {
              is: {
                name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            property: {
              is: {
                location: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            property: {
              is: {
                address: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            units: {
              some: {
                deletedAt: null,
                houseNo: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            caretakerAssignments: {
              some: {
                active: true,
                caretaker: {
                  is: {
                    fullName: {
                      contains: query,
                      mode: "insensitive",
                    },
                  },
                },
              },
            },
          },
          {
            caretakerAssignments: {
              some: {
                active: true,
                caretaker: {
                  is: {
                    phone: {
                      contains: query,
                      mode: "insensitive",
                    },
                  },
                },
              },
            },
          },
          {
            caretakerAssignments: {
              some: {
                active: true,
                caretaker: {
                  is: {
                    email: {
                      contains: query,
                      mode: "insensitive",
                    },
                  },
                },
              },
            },
          },
        ],
      }
    : {};

  return {
    AND: [
      {
        deletedAt: null,
        property: {
          is: {
            orgId: session.activeOrgId!,
            deletedAt: null,
          },
        },
      },
      scopeWhere,
      searchWhere,
    ],
  } satisfies Prisma.BuildingWhereInput;
}

export async function getBuildingsPageData(
  session: SessionWithScope,
  query: string,
  page = 1,
) {
  const buildingWhere = buildBuildingsWhere(session, query);
  const unitWhere: Prisma.UnitWhereInput = {
    deletedAt: null,
    building: buildingWhere,
  };

  const { page: currentPage, skip, take } = getPagination({
    page,
    pageSize: PAGE_SIZE,
  });

  const [
    organization,
    totalBuildings,
    activeBuildings,
    totalUnits,
    occupiedUnits,
    vacantUnits,
    buildings,
  ] = await Promise.all([
    prisma.organization.findFirst({
      where: {
        id: session.activeOrgId!,
        deletedAt: null,
      },
      select: {
        name: true,
      },
    }),
    prisma.building.count({ where: buildingWhere }),
    prisma.building.count({
      where: {
        AND: [...buildingWhere.AND, { isActive: true }],
      },
    }),
    prisma.unit.count({ where: unitWhere }),
    prisma.unit.count({
      where: {
        ...unitWhere,
        status: "OCCUPIED",
      },
    }),
    prisma.unit.count({
      where: {
        ...unitWhere,
        status: "VACANT",
      },
    }),
    prisma.building.findMany({
      where: buildingWhere,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            location: true,
            address: true,
          },
        },
        units: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            houseNo: true,
            status: true,
            isActive: true,
          },
        },
        caretakerAssignments: {
          where: {
            active: true,
          },
          include: {
            caretaker: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalBuildings / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const showingFrom = totalBuildings === 0 ? 0 : skip + 1;
  const showingTo = Math.min(skip + buildings.length, totalBuildings);

  return {
    organizationName: organization?.name ?? "Organisation",
    buildings,
    totalBuildings,
    activeBuildings,
    totalUnits,
    occupiedUnits,
    vacantUnits,
    query,
    currentPage: safePage,
    totalPages,
    showingFrom,
    showingTo,
  };
}