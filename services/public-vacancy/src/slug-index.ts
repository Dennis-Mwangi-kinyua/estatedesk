import {
  stripLegacyVacancySlug,
  vacancyPublicSlug,
} from "./slug";

export type VacancySlugIndexEntry = {
  id: string;
  propertyName: string;
  houseNo: string;
  publicSlug?: string | null;
};

/**
 * Resolve a unit id from an in-memory slug index.
 * When multiple units share the same base slug, prefer an entry whose stored
 * publicSlug is unique (ends with a disambiguator) matching the request, else
 * return null instead of an arbitrary first match (avoids wrong enquiries).
 */
export function resolveVacancyUnitIdFromSlugIndex(
  slug: string,
  index: VacancySlugIndexEntry[],
) {
  const canonicalSlug = stripLegacyVacancySlug(slug);

  const storedExact = index.filter((entry) => entry.publicSlug === canonicalSlug);
  if (storedExact.length === 1) return storedExact[0].id;
  if (storedExact.length > 1) return storedExact[0].id;

  const baseMatches = index.filter(
    (entry) =>
      vacancyPublicSlug({
        propertyName: entry.propertyName,
        houseNo: entry.houseNo,
      }) === canonicalSlug,
  );

  if (baseMatches.length === 1) return baseMatches[0].id;

  // Ambiguous base slug — refuse to guess (callers can 404 / redirect).
  if (baseMatches.length > 1) return null;

  return null;
}
