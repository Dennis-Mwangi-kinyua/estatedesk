import { unstable_cache } from "next/cache";
import { Prisma, UnitType } from "@prisma/client";
import { isTransientDatabaseError, retryTransientDatabaseOperation } from "@/lib/db/retry";
import { PUBLIC_VACANCIES_CACHE_TAG } from "./cache";
import { prisma } from "@/lib/prisma";

export const PUBLIC_VACANCY_REVALIDATE_SECONDS = 300;

const PUBLIC_VACANCY_RETRY_OPTIONS = {
  attempts: 2,
  delayMs: 250,
  label: "public-vacancy-list",
};

export function unitTypesForSearch(query: string): UnitType[] {
  const normalized = query.toLowerCase().replace(/[^a-z0-9]+/g, " ");
  const types: UnitType[] = [];

  if (/\bbedsitters?\b/.test(normalized)) types.push(UnitType.BEDSITTER);
  if (/\bstudios?\b/.test(normalized)) types.push(UnitType.STUDIO);
  if (/\bsingle\s*rooms?\b/.test(normalized)) types.push(UnitType.SINGLE_ROOM);
  if (/\bshops?\b/.test(normalized)) types.push(UnitType.SHOP);
  if (/\boffices?\b/.test(normalized)) types.push(UnitType.OFFICE);
  if (/\bstalls?\b/.test(normalized)) types.push(UnitType.STALL);
  if (/\bwarehouses?\b/.test(normalized)) types.push(UnitType.WAREHOUSE);
  if (/\bgodowns?\b/.test(normalized)) types.push(UnitType.GODOWN);
  if (/\bapartments?\b|\bflats?\b/.test(normalized)) types.push(UnitType.APARTMENT);

  return Array.from(new Set(types));
}

export function isPublicVacancyDatabaseError(error: unknown) {
  if (isTransientDatabaseError(error)) return true;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2021" || error.code === "P2022";
  }

  return false;
}

async function queryVacancyListings({
  query,
  location,
  sort,
}: {
  query: string;
  location: string;
  sort: "location" | "rent_asc" | "rent_desc";
}) {
  const queryUnitTypes = unitTypesForSearch(query);

  return retryTransientDatabaseOperation(
    () =>
      prisma.unit.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          status: "VACANT",
          ...(query
            ? {
                OR: [
                  { houseNo: { contains: query, mode: "insensitive" } },
                  { property: { is: { name: { contains: query, mode: "insensitive" } } } },
                  { property: { is: { location: { contains: query, mode: "insensitive" } } } },
                  { property: { is: { address: { contains: query, mode: "insensitive" } } } },
                  { property: { is: { org: { is: { name: { contains: query, mode: "insensitive" } } } } } },
                  { building: { is: { name: { contains: query, mode: "insensitive" } } } },
                  ...(queryUnitTypes.length ? [{ type: { in: queryUnitTypes } }] : []),
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
        },
        orderBy:
          sort === "rent_asc"
            ? [{ rentAmount: "asc" }, { property: { name: "asc" } }]
            : sort === "rent_desc"
              ? [{ rentAmount: "desc" }, { property: { name: "asc" } }]
              : [{ property: { location: "asc" } }, { property: { name: "asc" } }, { houseNo: "asc" }],
        take: 240,
        select: {
          id: true,
          houseNo: true,
          type: true,
          bedrooms: true,
          bathrooms: true,
          roomCount: true,
          rentAmount: true,
          serviceCharge: true,
          viewingFeeRequired: true,
          viewingFeeAmount: true,
          notes: true,
          images: {
            where: { deletedAt: null },
            orderBy: { createdAt: "asc" },
            take: 1,
            select: { key: true, fileName: true },
          },
          building: { select: { name: true } },
          property: {
            select: {
              name: true,
              location: true,
              address: true,
              notes: true,
              org: { select: { name: true, phone: true } },
            },
          },
        },
      }),
    PUBLIC_VACANCY_RETRY_OPTIONS,
  );
}

const publicVacancyCountWhere = {
  isActive: true,
  deletedAt: null,
  status: "VACANT" as const,
  property: {
    is: {
      isActive: true,
      deletedAt: null,
      org: {
        status: "ACTIVE" as const,
        deletedAt: null,
      },
    },
  },
};

async function queryVacancyListingsCount() {
  return retryTransientDatabaseOperation(
    () => prisma.unit.count({ where: publicVacancyCountWhere }),
    PUBLIC_VACANCY_RETRY_OPTIONS,
  );
}

export function getVacancyListingsCountCached() {
  return unstable_cache(
    () => queryVacancyListingsCount(),
    ["public-vacancy-listings-count"],
    {
      revalidate: PUBLIC_VACANCY_REVALIDATE_SECONDS,
      tags: [PUBLIC_VACANCIES_CACHE_TAG],
    },
  )();
}

export function getVacancyListingsCached(params: {
  query: string;
  location: string;
  sort: "location" | "rent_asc" | "rent_desc";
}) {
  const cacheKey = ["public-vacancy-listings", params.query, params.location, params.sort].join(":");

  return unstable_cache(
    () => queryVacancyListings(params),
    [cacheKey],
    {
      revalidate: PUBLIC_VACANCY_REVALIDATE_SECONDS,
      tags: [PUBLIC_VACANCIES_CACHE_TAG],
    },
  )();
}