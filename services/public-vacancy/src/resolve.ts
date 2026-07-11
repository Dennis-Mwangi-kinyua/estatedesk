import "server-only";

import { unstable_cache } from "next/cache";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { PUBLIC_VACANCIES_CACHE_TAG } from "./cache";
import { PUBLIC_VACANCY_REVALIDATE_SECONDS } from "./listings";
import {
  isRawDatabaseId,
  vacancyIdFromLegacySlug,
  vacancyPublicSlug,
  stripLegacyVacancySlug,
} from "./slug";
import {
  resolveVacancyUnitIdFromSlugIndex,
  type VacancySlugIndexEntry,
} from "./slug-index";
import { publicListedVacancyWhere } from "./where";
import { prisma } from "@/lib/prisma";

async function resolveVacancyUnitIdFromRawDatabaseId(id: string) {
  const unit = await prisma.unit.findFirst({
    where: {
      id,
      ...publicListedVacancyWhere,
    },
    select: { id: true },
  });

  return unit?.id ?? null;
}

async function resolveVacancyUnitIdFromStoredSlug(slug: string) {
  const unit = await prisma.unit.findFirst({
    where: {
      publicSlug: slug,
      ...publicListedVacancyWhere,
    },
    select: { id: true },
  });

  return unit?.id ?? null;
}

async function queryVacancySlugIndex(): Promise<VacancySlugIndexEntry[]> {
  const units = await retryTransientDatabaseOperation(
    () =>
      prisma.unit.findMany({
        where: publicListedVacancyWhere,
        select: {
          id: true,
          houseNo: true,
          publicSlug: true,
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
    publicSlug: unit.publicSlug,
  }));
}

function getVacancySlugIndexCached() {
  return unstable_cache(
    () => queryVacancySlugIndex(),
    ["public-vacancy-slug-index-v2"],
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

  const canonicalSlug = stripLegacyVacancySlug(slug);

  const byStoredSlug = await resolveVacancyUnitIdFromStoredSlug(canonicalSlug);
  if (byStoredSlug) return byStoredSlug;

  const index = await getVacancySlugIndexCached();

  // Prefer exact stored slug matches from the index
  const storedMatch = index.find((entry) => entry.publicSlug === canonicalSlug);
  if (storedMatch) return storedMatch.id;

  return resolveVacancyUnitIdFromSlugIndex(canonicalSlug, index);
}

export { vacancyPublicSlug };
