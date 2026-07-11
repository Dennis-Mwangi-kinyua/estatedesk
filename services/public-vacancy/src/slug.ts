import { decodePublicId, isEncodedPublicId } from "@/lib/public-id";

const VACANCY_SCOPE = "public-vacancy";
const LEGACY_TOKEN_SEPARATOR = "--";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Human-readable base path segment (may collide across orgs/properties). */
export function vacancyPublicSlug(input: {
  propertyName: string;
  houseNo: string;
}) {
  return slugify(`${input.propertyName} unit ${input.houseNo}`) || "vacancy";
}

/** Stable unique slug: base + short unit-id disambiguator when needed. */
export function vacancyPublicSlugForUnit(input: {
  propertyName: string;
  houseNo: string;
  unitId: string;
  forceUnique?: boolean;
}) {
  const base = vacancyPublicSlug(input);
  if (!input.forceUnique) return base;

  const suffix = input.unitId.replace(/[^a-z0-9]/gi, "").slice(-6).toLowerCase();
  return suffix ? `${base}-${suffix}` : base;
}

export function resolvePublicListingHref(input: {
  publicSlug?: string | null;
  propertyName: string;
  houseNo: string;
}) {
  const slug =
    input.publicSlug?.trim() ||
    vacancyPublicSlug({
      propertyName: input.propertyName,
      houseNo: input.houseNo,
    });

  return `/vacancies/${slug}`;
}

export function stripLegacyVacancySlug(slug: string) {
  if (!slug.includes(LEGACY_TOKEN_SEPARATOR)) return slug;

  return slug.slice(0, slug.lastIndexOf(LEGACY_TOKEN_SEPARATOR));
}

export function isLegacyVacancySlug(slug: string) {
  if (!slug.includes(LEGACY_TOKEN_SEPARATOR)) return false;

  const token = slug.slice(
    slug.lastIndexOf(LEGACY_TOKEN_SEPARATOR) + LEGACY_TOKEN_SEPARATOR.length,
  );

  return isEncodedPublicId(token);
}

export function vacancyIdFromLegacySlug(slug: string) {
  if (!isLegacyVacancySlug(slug)) return null;

  const token = slug.slice(
    slug.lastIndexOf(LEGACY_TOKEN_SEPARATOR) + LEGACY_TOKEN_SEPARATOR.length,
  );

  try {
    return decodePublicId(token, VACANCY_SCOPE);
  } catch {
    return null;
  }
}

export function isRawDatabaseId(value: string) {
  return /^c[a-z0-9]{20,}$/i.test(value);
}

export function vacancyOgImagePath(publicSlug: string) {
  return `/api/og/vacancy/${encodeURIComponent(publicSlug)}`;
}

/** @deprecated Use resolveVacancyUnitIdFromSlug for lookups. */
export function vacancyIdFromPublicSlug(value: string) {
  const legacyId = vacancyIdFromLegacySlug(value);
  if (legacyId) return legacyId;

  if (isRawDatabaseId(value)) return value;

  return stripLegacyVacancySlug(value);
}
