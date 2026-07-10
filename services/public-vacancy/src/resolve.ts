import "server-only";

import { unstable_cache } from "next/cache";
import { isTransientDatabaseError, retryTransientDatabaseOperation } from "@/lib/db/retry";
import { PUBLIC_VACANCIES_CACHE_TAG } from "./cache";
import { PUBLIC_VACANCY_REVALIDATE_SECONDS } from "./listings";
import {
  isRawDatabaseId,
  vacancyIdFromLegacySlug,
} from "./slug";
import {
  resolveVacancyUnitIdFromSlugIndex,
  type VacancySlugIndexEntry,
} from "./slug-index";
import { prisma } from "@/lib/prisma";

const publicVacancyUnitWhere = {
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

async function resolveVacancyUnitIdFromRawDatabaseId(id: string) {
  const unit = await prisma.unit.findFirst({
    where: {
      id,
      ...publicVacancyUnitWhere,
    },
    select: { id: true },
  });

  return unit?.id ?? null;
}

async function queryVacancySlugIndex(): Promise<VacancySlugIndexEntry[]> {
  const units = await retryTransientDatabaseOperation(
    () =>
      prisma.unit.findMany({
        where: publicVacancyUnitWhere,
        select: {
          id: true,
          houseNo: true,
          property: { select: { name: true } },
        },
      }),
    {
      attempts: 2,
      delayMs: 250,
      label: "public-vacancy-slug-index",
    },
  );

  return units.map((unit) => ({
    id: unit.id,
    propertyName: unit.property.name,
    houseNo: unit.houseNo,
  }));
}

function getVacancySlugIndexCached() {
  return unstable_cache(
    () => queryVacancySlugIndex(),
    ["public-vacancy-slug-index"],
    {
      revalidate: PUBLIC_VACANCY_REVALIDATE_SECONDS,
      tags: [PUBLIC_VACANCIES_CACHE_TAG],
    },
  )();
}

export async function resolveVacancyUnitIdFromSlug(slug: string) {
  const legacyId = vacancyIdFromLegacySlug(slug);
  if (legacyId) return legacyId;

  if (isRawDatabaseId(slug)) {
    return resolveVacancyUnitIdFromRawDatabaseId(slug);
  }

  const index = await getVacancySlugIndexCached();
  return resolveVacancyUnitIdFromSlugIndex(slug, index);
}