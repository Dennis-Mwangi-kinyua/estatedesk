import {
  stripLegacyVacancySlug,
  vacancyPublicSlug,
} from "./slug";

export type VacancySlugIndexEntry = {
  id: string;
  propertyName: string;
  houseNo: string;
};

export function resolveVacancyUnitIdFromSlugIndex(
  slug: string,
  index: VacancySlugIndexEntry[],
) {
  const canonicalSlug = stripLegacyVacancySlug(slug);
  const matches = index.filter(
    (entry) =>
      vacancyPublicSlug({
        propertyName: entry.propertyName,
        houseNo: entry.houseNo,
      }) === canonicalSlug,
  );

  if (matches.length === 1) return matches[0].id;

  return matches[0]?.id ?? null;
}