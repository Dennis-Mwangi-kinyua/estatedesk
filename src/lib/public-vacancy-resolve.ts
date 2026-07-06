import "server-only";

import { getVacancyListingsCached } from "@/lib/public-vacancy-listings";
import {
  isRawDatabaseId,
  stripLegacyVacancySlug,
  vacancyIdFromLegacySlug,
  vacancyPublicSlug,
} from "@/lib/public-vacancy-slug";
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

export async function resolveVacancyUnitIdFromSlug(slug: string) {
  const legacyId = vacancyIdFromLegacySlug(slug);
  if (legacyId) return legacyId;

  if (isRawDatabaseId(slug)) {
    return resolveVacancyUnitIdFromRawDatabaseId(slug);
  }

  const canonicalSlug = stripLegacyVacancySlug(slug);
  const listings = await getVacancyListingsCached({
    query: "",
    location: "",
    sort: "location",
  });

  const matches = listings.filter(
    (listing) =>
      vacancyPublicSlug({
        propertyName: listing.property.name,
        houseNo: listing.houseNo,
      }) === canonicalSlug,
  );

  if (matches.length === 1) return matches[0].id;

  return matches[0]?.id ?? null;
}