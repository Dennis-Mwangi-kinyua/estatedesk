import { Prisma, type UnitType } from "@prisma/client";

/** Shared filter for units that should appear on the public vacancies surface. */
export const publicListedVacancyWhere = {
  isActive: true,
  deletedAt: null,
  status: "VACANT" as const,
  isPubliclyListed: true,
  property: {
    is: {
      isActive: true,
      deletedAt: null,
      org: {
        is: {
          status: "ACTIVE" as const,
          deletedAt: null,
        },
      },
    },
  },
} satisfies Prisma.UnitWhereInput;

export type VacancyListSort = "location" | "rent_asc" | "rent_desc" | "newest";

export type VacancyListQuery = {
  query?: string;
  location?: string;
  sort?: VacancyListSort;
  type?: UnitType | string | null;
  minRent?: number | null;
  maxRent?: number | null;
  bedrooms?: number | null;
};

export function unitTypesForSearch(query: string): UnitType[] {
  const normalized = query.toLowerCase().replace(/[^a-z0-9]+/g, " ");
  const types: UnitType[] = [];

  if (/\bbedsitters?\b/.test(normalized)) types.push("BEDSITTER" as UnitType);
  if (/\bstudios?\b/.test(normalized)) types.push("STUDIO" as UnitType);
  if (/\bsingle\s*rooms?\b/.test(normalized)) types.push("SINGLE_ROOM" as UnitType);
  if (/\bshops?\b/.test(normalized)) types.push("SHOP" as UnitType);
  if (/\boffices?\b/.test(normalized)) types.push("OFFICE" as UnitType);
  if (/\bstalls?\b/.test(normalized)) types.push("STALL" as UnitType);
  if (/\bwarehouses?\b/.test(normalized)) types.push("WAREHOUSE" as UnitType);
  if (/\bgodowns?\b/.test(normalized)) types.push("GODOWN" as UnitType);
  if (/\bapartments?\b|\bflats?\b/.test(normalized)) types.push("APARTMENT" as UnitType);

  return Array.from(new Set(types));
}

const KNOWN_UNIT_TYPES = new Set([
  "APARTMENT",
  "BEDSITTER",
  "STUDIO",
  "SINGLE_ROOM",
  "SHOP",
  "OFFICE",
  "STALL",
  "WAREHOUSE",
  "GODOWN",
]);

export function normalizeUnitTypeFilter(
  value: string | null | undefined,
): UnitType | undefined {
  if (!value) return undefined;
  const upper = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (!KNOWN_UNIT_TYPES.has(upper)) return undefined;
  return upper as UnitType;
}

export function buildVacancyListWhere(params: VacancyListQuery): Prisma.UnitWhereInput {
  const query = params.query?.trim() ?? "";
  const location = params.location?.trim() ?? "";
  const queryUnitTypes = query ? unitTypesForSearch(query) : [];
  const typeFilter = normalizeUnitTypeFilter(params.type ?? undefined);
  const minRent =
    params.minRent != null && Number.isFinite(params.minRent)
      ? params.minRent
      : undefined;
  const maxRent =
    params.maxRent != null && Number.isFinite(params.maxRent)
      ? params.maxRent
      : undefined;
  const bedrooms =
    params.bedrooms != null && Number.isFinite(params.bedrooms) && params.bedrooms > 0
      ? Math.floor(params.bedrooms)
      : undefined;

  return {
    ...publicListedVacancyWhere,
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(bedrooms
      ? {
          OR: [{ bedrooms: { gte: bedrooms } }, { roomCount: { gte: bedrooms } }],
        }
      : {}),
    ...(minRent != null || maxRent != null
      ? {
          rentAmount: {
            ...(minRent != null ? { gte: minRent } : {}),
            ...(maxRent != null ? { lte: maxRent } : {}),
          },
        }
      : {}),
    ...(query
      ? {
          AND: [
            {
              OR: [
                { houseNo: { contains: query, mode: "insensitive" } },
                { property: { is: { name: { contains: query, mode: "insensitive" } } } },
                { property: { is: { location: { contains: query, mode: "insensitive" } } } },
                { property: { is: { address: { contains: query, mode: "insensitive" } } } },
                {
                  property: {
                    is: { org: { is: { name: { contains: query, mode: "insensitive" } } } },
                  },
                },
                { building: { is: { name: { contains: query, mode: "insensitive" } } } },
                ...(queryUnitTypes.length ? [{ type: { in: queryUnitTypes } }] : []),
              ],
            },
          ],
        }
      : {}),
    property: {
      is: {
        isActive: true,
        deletedAt: null,
        org: {
          is: {
            status: "ACTIVE",
            deletedAt: null,
          },
        },
        ...(location
          ? {
              OR: [
                { location: { contains: location, mode: "insensitive" } },
                { address: { contains: location, mode: "insensitive" } },
                { name: { contains: location, mode: "insensitive" } },
              ],
            }
          : {}),
      },
    },
  };
}

export function vacancyListOrderBy(
  sort: VacancyListSort = "location",
): Prisma.UnitOrderByWithRelationInput[] {
  if (sort === "rent_asc") {
    return [{ rentAmount: "asc" }, { property: { name: "asc" } }];
  }
  if (sort === "rent_desc") {
    return [{ rentAmount: "desc" }, { property: { name: "asc" } }];
  }
  if (sort === "newest") {
    return [{ updatedAt: "desc" }, { property: { name: "asc" } }];
  }
  return [
    { property: { location: "asc" } },
    { property: { name: "asc" } },
    { houseNo: "asc" },
  ];
}
