import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { requireManagementAccess } from "@/lib/permissions/guards";
import {
  buildPageHref,
  decodeUnitMixKey,
  encodeUnitMixKey,
  formatUnitMixLabel,
  formatUnitTypeLabel,
  normalizeQuery,
  parseActivityFilter,
  parsePage,
  parseStatusFilter,
} from "./helpers";
import {
  PROPERTY_PAGE_SIZE,
  UNIT_PAGE_SIZE,
  type PropertyDirectoryItem,
  type UnitMixGroupItem,
  type UnitsPageData,
  type UnitsPageView,
} from "./types";

type ManagementSession = Awaited<ReturnType<typeof requireManagementAccess>>;

function buildScopeWhere(
  session: ManagementSession,
): Prisma.UnitWhereInput {
  if (session.membershipScope?.scopeType === "PROPERTY") {
    return { propertyId: session.membershipScope.scopeId };
  }

  if (session.membershipScope?.scopeType === "BUILDING") {
    return { buildingId: session.membershipScope.scopeId };
  }

  if (session.membershipScope?.scopeType === "UNIT") {
    return { id: session.membershipScope.scopeId };
  }

  return {};
}

function buildFilteredWhere(
  orgId: string,
  scopeWhere: Prisma.UnitWhereInput,
  q: string,
  status: ReturnType<typeof parseStatusFilter>,
  activity: ReturnType<typeof parseActivityFilter>,
): Prisma.UnitWhereInput {
  return {
    deletedAt: null,
    property: {
      is: {
        orgId,
        deletedAt: null,
      },
    },
    ...scopeWhere,
    ...(status !== "ALL" ? { status } : {}),
    ...(activity === "ACTIVE"
      ? { isActive: true }
      : activity === "INACTIVE"
        ? { isActive: false }
        : {}),
    ...(q
      ? {
          OR: [
            { houseNo: { contains: q, mode: "insensitive" } },
            {
              property: {
                is: {
                  name: { contains: q, mode: "insensitive" },
                },
              },
            },
            {
              property: {
                is: {
                  location: { contains: q, mode: "insensitive" },
                },
              },
            },
            {
              property: {
                is: {
                  address: { contains: q, mode: "insensitive" },
                },
              },
            },
            {
              building: {
                is: {
                  name: { contains: q, mode: "insensitive" },
                },
              },
            },
          ],
        }
      : {}),
  };
}

async function loadOrgStats(
  orgId: string,
  baseWhere: Prisma.UnitWhereInput,
) {
  const [organization, totalUnits, activeUnits, occupiedUnits, vacantUnits] =
    await Promise.all([
      prisma.organization.findFirst({
        where: {
          id: orgId,
          deletedAt: null,
        },
        select: {
          name: true,
          currencyCode: true,
        },
      }),
      prisma.unit.count({ where: baseWhere }),
      prisma.unit.count({
        where: {
          ...baseWhere,
          isActive: true,
        },
      }),
      prisma.unit.count({
        where: {
          ...baseWhere,
          status: "OCCUPIED",
        },
      }),
      prisma.unit.count({
        where: {
          ...baseWhere,
          status: "VACANT",
        },
      }),
    ]);

  return {
    organizationName: organization?.name ?? "Organisation",
    currencyCode: organization?.currencyCode ?? "KES",
    totalUnits,
    activeUnits,
    occupiedUnits,
    vacantUnits,
  };
}

async function loadPropertyDirectory(
  orgId: string,
  filteredWhere: Prisma.UnitWhereInput,
  requestedPage: number,
) {
  const [statusGroups, mixGroups] = await Promise.all([
    prisma.unit.groupBy({
      by: ["propertyId", "status"],
      where: filteredWhere,
      _count: { _all: true },
    }),
    prisma.unit.groupBy({
      by: ["propertyId", "type", "bedrooms"],
      where: filteredWhere,
      _count: { _all: true },
    }),
  ]);

  const propertyStats = new Map<
    string,
    {
      totalUnits: number;
      occupiedUnits: number;
      vacantUnits: number;
      mixKeys: Set<string>;
    }
  >();

  for (const row of statusGroups) {
    const current = propertyStats.get(row.propertyId) ?? {
      totalUnits: 0,
      occupiedUnits: 0,
      vacantUnits: 0,
      mixKeys: new Set<string>(),
    };

    current.totalUnits += row._count._all;
    if (row.status === "OCCUPIED") current.occupiedUnits += row._count._all;
    if (row.status === "VACANT") current.vacantUnits += row._count._all;
    propertyStats.set(row.propertyId, current);
  }

  for (const row of mixGroups) {
    const current = propertyStats.get(row.propertyId) ?? {
      totalUnits: 0,
      occupiedUnits: 0,
      vacantUnits: 0,
      mixKeys: new Set<string>(),
    };

    current.mixKeys.add(encodeUnitMixKey(row.type, row.bedrooms));
    propertyStats.set(row.propertyId, current);
  }

  const propertyIds = [...propertyStats.keys()];

  if (propertyIds.length === 0) {
    return {
      propertyDirectory: [] as PropertyDirectoryItem[],
      filteredTotal: 0,
      filteredOccupied: 0,
      filteredVacant: 0,
      filteredActive: 0,
      currentPage: 1,
      totalPages: 1,
      showingFrom: 0,
      showingTo: 0,
    };
  }

  const properties = await prisma.property.findMany({
    where: {
      id: { in: propertyIds },
      orgId,
      deletedAt: null,
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      location: true,
      address: true,
    },
  });

  const directoryItems: PropertyDirectoryItem[] = properties.map((property) => {
    const stats = propertyStats.get(property.id)!;
    return {
      property,
      totalUnits: stats.totalUnits,
      occupiedUnits: stats.occupiedUnits,
      vacantUnits: stats.vacantUnits,
      mixCount: stats.mixKeys.size,
    };
  });

  const filteredTotal = directoryItems.length;
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PROPERTY_PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const start = (currentPage - 1) * PROPERTY_PAGE_SIZE;
  const pageItems = directoryItems.slice(start, start + PROPERTY_PAGE_SIZE);

  const filteredOccupied = pageItems.reduce(
    (sum, item) => sum + item.occupiedUnits,
    0,
  );
  const filteredVacant = pageItems.reduce(
    (sum, item) => sum + item.vacantUnits,
    0,
  );

  return {
    propertyDirectory: pageItems,
    filteredTotal,
    filteredOccupied,
    filteredVacant,
    filteredActive: 0,
    currentPage,
    totalPages,
    showingFrom: filteredTotal === 0 ? 0 : start + 1,
    showingTo: Math.min(start + PROPERTY_PAGE_SIZE, filteredTotal),
  };
}

async function loadMixGroups(
  orgId: string,
  propertyId: string,
  filteredWhere: Prisma.UnitWhereInput,
) {
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      orgId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      location: true,
      address: true,
    },
  });

  if (!property) {
    redirect("/dashboard/org/units");
  }

  const groups = await prisma.unit.groupBy({
    by: ["type", "bedrooms", "status"],
    where: {
      ...filteredWhere,
      propertyId,
    },
    _count: { _all: true },
  });

  const mixStats = new Map<
    string,
    {
      label: string;
      totalUnits: number;
      occupiedUnits: number;
      vacantUnits: number;
    }
  >();

  for (const row of groups) {
    const key = encodeUnitMixKey(row.type, row.bedrooms);
    const current = mixStats.get(key) ?? {
      label: formatUnitTypeLabel(row.type, row.bedrooms),
      totalUnits: 0,
      occupiedUnits: 0,
      vacantUnits: 0,
    };

    current.totalUnits += row._count._all;
    if (row.status === "OCCUPIED") current.occupiedUnits += row._count._all;
    if (row.status === "VACANT") current.vacantUnits += row._count._all;
    mixStats.set(key, current);
  }

  const unitMixGroups: UnitMixGroupItem[] = [...mixStats.entries()]
    .map(([key, stats]) => ({
      key,
      label: stats.label,
      totalUnits: stats.totalUnits,
      occupiedUnits: stats.occupiedUnits,
      vacantUnits: stats.vacantUnits,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const filteredTotal = unitMixGroups.reduce(
    (sum, group) => sum + group.totalUnits,
    0,
  );
  const filteredOccupied = unitMixGroups.reduce(
    (sum, group) => sum + group.occupiedUnits,
    0,
  );
  const filteredVacant = unitMixGroups.reduce(
    (sum, group) => sum + group.vacantUnits,
    0,
  );

  return {
    selectedProperty: property,
    unitMixGroups,
    filteredTotal,
    filteredOccupied,
    filteredVacant,
    filteredActive: 0,
    currentPage: 1,
    totalPages: 1,
    showingFrom: filteredTotal === 0 ? 0 : 1,
    showingTo: filteredTotal,
  };
}

async function loadUnitList(
  orgId: string,
  propertyId: string,
  mixKey: string,
  filteredWhere: Prisma.UnitWhereInput,
  requestedPage: number,
) {
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      orgId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      location: true,
      address: true,
    },
  });

  if (!property) {
    redirect("/dashboard/org/units");
  }

  const decodedMix = decodeUnitMixKey(mixKey);
  const mixWhere: Prisma.UnitWhereInput =
    decodedMix.type === "APARTMENT"
      ? {
          type: "APARTMENT",
          bedrooms: decodedMix.bedrooms ?? undefined,
        }
      : { type: decodedMix.type as Prisma.EnumUnitTypeFilter["equals"] };

  const listWhere: Prisma.UnitWhereInput = {
    ...filteredWhere,
    propertyId,
    ...mixWhere,
  };

  const filteredTotal = await prisma.unit.count({ where: listWhere });
  const totalPages = Math.max(1, Math.ceil(filteredTotal / UNIT_PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  const units = await prisma.unit.findMany({
    where: listWhere,
    orderBy: [{ building: { name: "asc" } }, { houseNo: "asc" }],
    skip: (currentPage - 1) * UNIT_PAGE_SIZE,
    take: UNIT_PAGE_SIZE,
    select: {
      id: true,
      houseNo: true,
      type: true,
      bedrooms: true,
      bathrooms: true,
      rentAmount: true,
      status: true,
      isActive: true,
      property: {
        select: {
          id: true,
          name: true,
          location: true,
          address: true,
        },
      },
      building: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const filteredOccupied = units.filter((unit) => unit.status === "OCCUPIED").length;
  const filteredVacant = units.filter((unit) => unit.status === "VACANT").length;
  const filteredActive = units.filter((unit) => unit.isActive).length;

  return {
    selectedProperty: property,
    selectedMix: {
      key: mixKey,
      label: formatUnitMixLabel(mixKey),
    },
    units,
    filteredTotal,
    filteredOccupied,
    filteredVacant,
    filteredActive,
    currentPage,
    totalPages,
    showingFrom: filteredTotal === 0 ? 0 : (currentPage - 1) * UNIT_PAGE_SIZE + 1,
    showingTo: Math.min(currentPage * UNIT_PAGE_SIZE, filteredTotal),
  };
}

export async function loadUnitsPageData(
  session: ManagementSession,
  searchParams: Record<string, string | undefined>,
): Promise<UnitsPageData> {
  if (!session.activeOrgId) {
    redirect("/dashboard");
  }

  const orgId = session.activeOrgId;
  const q = normalizeQuery(searchParams.q);
  const status = parseStatusFilter(searchParams.status);
  const activity = parseActivityFilter(searchParams.activity);
  const propertyId = normalizeQuery(searchParams.property);
  const mixKey = normalizeQuery(searchParams.mix);
  const requestedPage = parsePage(searchParams.page);

  const scopeWhere = buildScopeWhere(session);
  const baseWhere: Prisma.UnitWhereInput = {
    deletedAt: null,
    property: {
      is: {
        orgId,
        deletedAt: null,
      },
    },
    ...scopeWhere,
  };

  const filteredWhere = buildFilteredWhere(
    orgId,
    scopeWhere,
    q,
    status,
    activity,
  );

  const orgStats = await loadOrgStats(orgId, baseWhere);
  const hasFilters = Boolean(q) || status !== "ALL" || activity !== "ALL";

  const shared = {
    ...orgStats,
    q,
    status,
    activity,
    propertyId: propertyId || null,
    mixKey: mixKey || null,
    hasFilters,
  };

  if (propertyId && mixKey) {
    const pagePayload = await loadUnitList(
      orgId,
      propertyId,
      mixKey,
      filteredWhere,
      requestedPage,
    );

    return {
      view: "units" as const,
      ...shared,
      ...pagePayload,
      prevHref: buildPageHref({
        page: Math.max(1, pagePayload.currentPage - 1),
        q: q || undefined,
        status,
        activity,
        property: propertyId || undefined,
        mix: mixKey || undefined,
      }),
      nextHref: buildPageHref({
        page: pagePayload.currentPage + 1,
        q: q || undefined,
        status,
        activity,
        property: propertyId || undefined,
        mix: mixKey || undefined,
      }),
    };
  }

  if (propertyId) {
    const pagePayload = await loadMixGroups(orgId, propertyId, filteredWhere);

    return {
      view: "mixes" as const,
      ...shared,
      ...pagePayload,
      prevHref: buildPageHref({
        page: Math.max(1, pagePayload.currentPage - 1),
        q: q || undefined,
        status,
        activity,
        property: propertyId || undefined,
        mix: mixKey || undefined,
      }),
      nextHref: buildPageHref({
        page: pagePayload.currentPage + 1,
        q: q || undefined,
        status,
        activity,
        property: propertyId || undefined,
        mix: mixKey || undefined,
      }),
    };
  }

  const pagePayload = await loadPropertyDirectory(
    orgId,
    filteredWhere,
    requestedPage,
  );

  return {
    view: "properties" as const,
    ...shared,
    ...pagePayload,
    prevHref: buildPageHref({
      page: Math.max(1, pagePayload.currentPage - 1),
      q: q || undefined,
      status,
      activity,
      property: propertyId || undefined,
      mix: mixKey || undefined,
    }),
    nextHref: buildPageHref({
      page: pagePayload.currentPage + 1,
      q: q || undefined,
      status,
      activity,
      property: propertyId || undefined,
      mix: mixKey || undefined,
    }),
  };
}