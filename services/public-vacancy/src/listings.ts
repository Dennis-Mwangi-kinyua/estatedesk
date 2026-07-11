import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { isTransientDatabaseError, retryTransientDatabaseOperation } from "@/lib/db/retry";
import { PUBLIC_VACANCIES_CACHE_TAG } from "./cache";
import { prisma } from "@/lib/prisma";
import {
  buildVacancyListWhere,
  unitTypesForSearch,
  vacancyListOrderBy,
  type VacancyListQuery,
  type VacancyListSort,
} from "./where";

export const PUBLIC_VACANCY_REVALIDATE_SECONDS = 300;
export const PUBLIC_VACANCY_LIST_PAGE_SIZE = 12;
export const PUBLIC_VACANCY_MAX_PAGE_SIZE = 48;

const PUBLIC_VACANCY_RETRY_OPTIONS = {
  attempts: 2,
  delayMs: 250,
  label: "public-vacancy-list",
};

export { unitTypesForSearch };
export type { VacancyListQuery, VacancyListSort };

export function isPublicVacancyDatabaseError(error: unknown) {
  if (isTransientDatabaseError(error)) return true;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2021" || error.code === "P2022";
  }

  return false;
}

const listingSelect = {
  id: true,
  houseNo: true,
  type: true,
  bedrooms: true,
  bathrooms: true,
  roomCount: true,
  rentAmount: true,
  depositAmount: true,
  serviceCharge: true,
  viewingFeeRequired: true,
  viewingFeeAmount: true,
  notes: true,
  publicSlug: true,
  isPubliclyListed: true,
  updatedAt: true,
  images: {
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" as const },
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
} satisfies Prisma.UnitSelect;

export type VacancyListingRow = Prisma.UnitGetPayload<{ select: typeof listingSelect }>;

export type VacancyListPageResult = {
  items: VacancyListingRow[];
  total: number;
  page: number;
  pageSize: number;
};

function normalizePage(page: number | undefined) {
  if (!page || !Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

function normalizePageSize(pageSize: number | undefined) {
  if (!pageSize || !Number.isFinite(pageSize) || pageSize < 1) {
    return PUBLIC_VACANCY_LIST_PAGE_SIZE;
  }
  return Math.min(Math.floor(pageSize), PUBLIC_VACANCY_MAX_PAGE_SIZE);
}

async function queryVacancyListingsPage(params: VacancyListQuery & {
  page?: number;
  pageSize?: number;
}): Promise<VacancyListPageResult> {
  const page = normalizePage(params.page);
  const pageSize = normalizePageSize(params.pageSize);
  const where = buildVacancyListWhere(params);
  const orderBy = vacancyListOrderBy(params.sort ?? "location");

  return retryTransientDatabaseOperation(
    async () => {
      const [total, items] = await Promise.all([
        prisma.unit.count({ where }),
        prisma.unit.findMany({
          where,
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: listingSelect,
        }),
      ]);

      return { items, total, page, pageSize };
    },
    PUBLIC_VACANCY_RETRY_OPTIONS,
  );
}

async function queryVacancyListingsCount(params: VacancyListQuery = {}) {
  const where = buildVacancyListWhere(params);
  return retryTransientDatabaseOperation(
    () => prisma.unit.count({ where }),
    PUBLIC_VACANCY_RETRY_OPTIONS,
  );
}

export function getVacancyListingsCountCached(params: VacancyListQuery = {}) {
  const cacheKey = [
    "public-vacancy-listings-count",
    params.query ?? "",
    params.location ?? "",
    params.type ?? "",
    String(params.minRent ?? ""),
    String(params.maxRent ?? ""),
    String(params.bedrooms ?? ""),
  ].join(":");

  return unstable_cache(
    () => queryVacancyListingsCount(params),
    [cacheKey],
    {
      revalidate: PUBLIC_VACANCY_REVALIDATE_SECONDS,
      tags: [PUBLIC_VACANCIES_CACHE_TAG],
    },
  )();
}

/** DB-backed paginated listing (preferred). */
export function getVacancyListingsPageCached(
  params: VacancyListQuery & { page?: number; pageSize?: number },
) {
  const cacheKey = [
    "public-vacancy-listings-page",
    params.query ?? "",
    params.location ?? "",
    params.sort ?? "location",
    params.type ?? "",
    String(params.minRent ?? ""),
    String(params.maxRent ?? ""),
    String(params.bedrooms ?? ""),
    String(params.page ?? 1),
    String(params.pageSize ?? PUBLIC_VACANCY_LIST_PAGE_SIZE),
  ].join(":");

  return unstable_cache(
    () => queryVacancyListingsPage(params),
    [cacheKey],
    {
      revalidate: PUBLIC_VACANCY_REVALIDATE_SECONDS,
      tags: [PUBLIC_VACANCIES_CACHE_TAG],
    },
  )();
}

/**
 * @deprecated Prefer getVacancyListingsPageCached for true pagination.
 * Kept for call sites that still expect a flat array (returns first page only, size 240 max for safety).
 */
export function getVacancyListingsCached(params: {
  query: string;
  location: string;
  sort: "location" | "rent_asc" | "rent_desc";
}) {
  return getVacancyListingsPageCached({
    ...params,
    page: 1,
    pageSize: 240,
  }).then((result) => result.items);
}
