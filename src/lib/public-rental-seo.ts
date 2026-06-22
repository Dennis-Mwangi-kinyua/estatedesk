export type PublicRentalCategory = {
  slug: string;
  label: string;
  pluralLabel: string;
  searchTerm: string;
  intentPhrases: string[];
};

export type PublicRentalLocation = {
  slug: string;
  label: string;
  county?: string;
  aliases: string[];
};

export const PUBLIC_RENTAL_CATEGORIES = [
  {
    slug: "bedsitters",
    label: "Bedsitter",
    pluralLabel: "Bedsitters",
    searchTerm: "bedsitters",
    intentPhrases: ["bedsitters for rent", "cheap bedsitters", "vacant bedsitters"],
  },
  {
    slug: "single-rooms",
    label: "Single room",
    pluralLabel: "Single rooms",
    searchTerm: "single rooms",
    intentPhrases: ["single rooms for rent", "vacant single rooms", "affordable single rooms"],
  },
  {
    slug: "studios",
    label: "Studio",
    pluralLabel: "Studios",
    searchTerm: "studios",
    intentPhrases: ["studio apartments", "studios for rent", "vacant studios"],
  },
  {
    slug: "apartments",
    label: "Apartment",
    pluralLabel: "Apartments",
    searchTerm: "apartments",
    intentPhrases: ["apartments for rent", "vacant apartments", "rental apartments"],
  },
  {
    slug: "shops",
    label: "Shop",
    pluralLabel: "Shops",
    searchTerm: "shops",
    intentPhrases: ["shops to let", "shops for rent", "vacant shops"],
  },
  {
    slug: "offices",
    label: "Office",
    pluralLabel: "Offices",
    searchTerm: "offices",
    intentPhrases: ["offices to let", "offices for rent", "vacant offices"],
  },
] as const satisfies readonly PublicRentalCategory[];

export const PUBLIC_RENTAL_LOCATIONS = [
  { slug: "nairobi", label: "Nairobi", county: "Nairobi", aliases: ["Nairobi County"] },
  { slug: "westlands", label: "Westlands", county: "Nairobi", aliases: ["Westlands Nairobi"] },
  { slug: "kilimani", label: "Kilimani", county: "Nairobi", aliases: ["Kilimani Nairobi"] },
  { slug: "embakasi", label: "Embakasi", county: "Nairobi", aliases: ["Embakasi Nairobi"] },
  { slug: "kasarani", label: "Kasarani", county: "Nairobi", aliases: ["Kasarani Nairobi"] },
  { slug: "ruaka", label: "Ruaka", county: "Kiambu", aliases: ["Ruaka Kiambu"] },
  { slug: "kiambu", label: "Kiambu", county: "Kiambu", aliases: ["Kiambu Town"] },
  { slug: "thika", label: "Thika", county: "Kiambu", aliases: ["Thika Road"] },
  { slug: "rongai", label: "Rongai", county: "Kajiado", aliases: ["Ongata Rongai"] },
  { slug: "kitengela", label: "Kitengela", county: "Kajiado", aliases: ["Kitengela Kajiado"] },
  { slug: "nakuru", label: "Nakuru", county: "Nakuru", aliases: ["Nakuru Town"] },
  { slug: "mombasa", label: "Mombasa", county: "Mombasa", aliases: ["Mombasa County"] },
  { slug: "kisumu", label: "Kisumu", county: "Kisumu", aliases: ["Kisumu County"] },
] as const satisfies readonly PublicRentalLocation[];

export function getPublicRentalCategory(slug: string) {
  const normalized = slug.toLowerCase();
  return PUBLIC_RENTAL_CATEGORIES.find((category) => category.slug === normalized);
}

export function getPublicRentalLocation(slug: string) {
  const normalized = slug.toLowerCase();
  return PUBLIC_RENTAL_LOCATIONS.find((location) => location.slug === normalized);
}

export function titleCaseSegment(value: string) {
  return value
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function categorySearchTerm(category: string) {
  return getPublicRentalCategory(category)?.searchTerm ?? category.toLowerCase().replace(/-/g, " ");
}

export function categoryLabel(category: string) {
  return getPublicRentalCategory(category)?.pluralLabel ?? titleCaseSegment(categorySearchTerm(category));
}

export function locationLabel(location: string) {
  return getPublicRentalLocation(location)?.label ?? titleCaseSegment(location);
}

export function buildRentalLandingTitle(location: string, category: string) {
  return `${categoryLabel(category)} in ${locationLabel(location)}`;
}

export function buildRentalLandingDescription(location: string, category: string) {
  const categoryInfo = getPublicRentalCategory(category);
  const locationInfo = getPublicRentalLocation(location);
  const categoryText = categoryInfo?.searchTerm ?? categorySearchTerm(category);
  const locationText = locationInfo
    ? `${locationInfo.label}${locationInfo.county ? `, ${locationInfo.county}` : ""}`
    : locationLabel(location);
  const intent = categoryInfo?.intentPhrases[0] ?? `${categoryText} for rent`;

  return `Find ${intent} in ${locationText} on EstateDesk with rent, unit details, viewing information, location filters, and manager contacts.`;
}

export function publicRentalLandingPaths() {
  return PUBLIC_RENTAL_LOCATIONS.flatMap((location) =>
    PUBLIC_RENTAL_CATEGORIES.map((category) => ({
      location: location.slug,
      category: category.slug,
      path: `/vacancies/${location.slug}/${category.slug}`,
      title: buildRentalLandingTitle(location.slug, category.slug),
    })),
  );
}
