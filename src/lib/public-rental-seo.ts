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
  { slug: "kileleshwa", label: "Kileleshwa", county: "Nairobi", aliases: ["Kileleshwa Nairobi"] },
  { slug: "lavington", label: "Lavington", county: "Nairobi", aliases: ["Lavington Nairobi"] },
  { slug: "karen", label: "Karen", county: "Nairobi", aliases: ["Karen Nairobi"] },
  { slug: "langata", label: "Langata", county: "Nairobi", aliases: ["Langata Nairobi"] },
  { slug: "south-b", label: "South B", county: "Nairobi", aliases: ["South B Nairobi"] },
  { slug: "south-c", label: "South C", county: "Nairobi", aliases: ["South C Nairobi"] },
  { slug: "imara-daima", label: "Imara Daima", county: "Nairobi", aliases: ["Imara Daima Nairobi"] },
  { slug: "donholm", label: "Donholm", county: "Nairobi", aliases: ["Donholm Nairobi"] },
  { slug: "buruburu", label: "Buruburu", county: "Nairobi", aliases: ["Buru Buru", "Buruburu Nairobi"] },
  { slug: "umoja", label: "Umoja", county: "Nairobi", aliases: ["Umoja Nairobi"] },
  { slug: "embakasi", label: "Embakasi", county: "Nairobi", aliases: ["Embakasi Nairobi"] },
  { slug: "kasarani", label: "Kasarani", county: "Nairobi", aliases: ["Kasarani Nairobi"] },
  { slug: "roysambu", label: "Roysambu", county: "Nairobi", aliases: ["Roysambu Nairobi"] },
  { slug: "githurai", label: "Githurai", county: "Nairobi", aliases: ["Githurai 44", "Githurai 45"] },
  { slug: "kahawa", label: "Kahawa", county: "Nairobi", aliases: ["Kahawa West", "Kahawa Sukari"] },
  { slug: "ruaraka", label: "Ruaraka", county: "Nairobi", aliases: ["Ruaraka Nairobi"] },
  { slug: "parklands", label: "Parklands", county: "Nairobi", aliases: ["Parklands Nairobi"] },
  { slug: "ngara", label: "Ngara", county: "Nairobi", aliases: ["Ngara Nairobi"] },
  { slug: "pangani", label: "Pangani", county: "Nairobi", aliases: ["Pangani Nairobi"] },
  { slug: "muthaiga", label: "Muthaiga", county: "Nairobi", aliases: ["Muthaiga Nairobi"] },
  { slug: "runda", label: "Runda", county: "Nairobi", aliases: ["Runda Nairobi"] },
  { slug: "gigiri", label: "Gigiri", county: "Nairobi", aliases: ["Gigiri Nairobi"] },
  { slug: "eastleigh", label: "Eastleigh", county: "Nairobi", aliases: ["Eastleigh Nairobi"] },
  { slug: "kayole", label: "Kayole", county: "Nairobi", aliases: ["Kayole Nairobi"] },
  { slug: "komarock", label: "Komarock", county: "Nairobi", aliases: ["Komarock Nairobi"] },
  { slug: "utawala", label: "Utawala", county: "Nairobi", aliases: ["Utawala Nairobi"] },
  { slug: "syokimau", label: "Syokimau", county: "Machakos", aliases: ["Syokimau Nairobi"] },
  { slug: "mlolongo", label: "Mlolongo", county: "Machakos", aliases: ["Mlolongo Nairobi"] },
  { slug: "athi-river", label: "Athi River", county: "Machakos", aliases: ["Athi River Machakos"] },
  { slug: "machakos", label: "Machakos", county: "Machakos", aliases: ["Machakos Town"] },
  { slug: "ruaka", label: "Ruaka", county: "Kiambu", aliases: ["Ruaka Kiambu"] },
  { slug: "kiambu", label: "Kiambu", county: "Kiambu", aliases: ["Kiambu Town"] },
  { slug: "thika", label: "Thika", county: "Kiambu", aliases: ["Thika Road"] },
  { slug: "juja", label: "Juja", county: "Kiambu", aliases: ["Juja Kiambu"] },
  { slug: "runda-mumwe", label: "Runda Mumwe", county: "Kiambu", aliases: ["Runda Mumwe Kiambu"] },
  { slug: "kikuyu", label: "Kikuyu", county: "Kiambu", aliases: ["Kikuyu Town"] },
  { slug: "limuru", label: "Limuru", county: "Kiambu", aliases: ["Limuru Town"] },
  { slug: "ruiru", label: "Ruiru", county: "Kiambu", aliases: ["Ruiru Town"] },
  { slug: "kabete", label: "Kabete", county: "Kiambu", aliases: ["Lower Kabete"] },
  { slug: "banana", label: "Banana", county: "Kiambu", aliases: ["Banana Hill"] },
  { slug: "tigoni", label: "Tigoni", county: "Kiambu", aliases: ["Tigoni Limuru"] },
  { slug: "rongai", label: "Rongai", county: "Kajiado", aliases: ["Ongata Rongai"] },
  { slug: "kitengela", label: "Kitengela", county: "Kajiado", aliases: ["Kitengela Kajiado"] },
  { slug: "ngong", label: "Ngong", county: "Kajiado", aliases: ["Ngong Town"] },
  { slug: "kiserian", label: "Kiserian", county: "Kajiado", aliases: ["Kiserian Kajiado"] },
  { slug: "kajiado", label: "Kajiado", county: "Kajiado", aliases: ["Kajiado Town"] },
  { slug: "nakuru", label: "Nakuru", county: "Nakuru", aliases: ["Nakuru Town"] },
  { slug: "naivasha", label: "Naivasha", county: "Nakuru", aliases: ["Naivasha Town"] },
  { slug: "gilgil", label: "Gilgil", county: "Nakuru", aliases: ["Gilgil Town"] },
  { slug: "njoro", label: "Njoro", county: "Nakuru", aliases: ["Njoro Town"] },
  { slug: "molo", label: "Molo", county: "Nakuru", aliases: ["Molo Town"] },
  { slug: "eldoret", label: "Eldoret", county: "Uasin Gishu", aliases: ["Eldoret Town"] },
  { slug: "kitale", label: "Kitale", county: "Trans Nzoia", aliases: ["Kitale Town"] },
  { slug: "kapsabet", label: "Kapsabet", county: "Nandi", aliases: ["Kapsabet Town"] },
  { slug: "kericho", label: "Kericho", county: "Kericho", aliases: ["Kericho Town"] },
  { slug: "narok", label: "Narok", county: "Narok", aliases: ["Narok Town"] },
  { slug: "mombasa", label: "Mombasa", county: "Mombasa", aliases: ["Mombasa County"] },
  { slug: "nyali", label: "Nyali", county: "Mombasa", aliases: ["Nyali Mombasa"] },
  { slug: "bamburi", label: "Bamburi", county: "Mombasa", aliases: ["Bamburi Mombasa"] },
  { slug: "likoni", label: "Likoni", county: "Mombasa", aliases: ["Likoni Mombasa"] },
  { slug: "changamwe", label: "Changamwe", county: "Mombasa", aliases: ["Changamwe Mombasa"] },
  { slug: "mtwapa", label: "Mtwapa", county: "Kilifi", aliases: ["Mtwapa Kilifi"] },
  { slug: "kilifi", label: "Kilifi", county: "Kilifi", aliases: ["Kilifi Town"] },
  { slug: "malindi", label: "Malindi", county: "Kilifi", aliases: ["Malindi Town"] },
  { slug: "diani", label: "Diani", county: "Kwale", aliases: ["Diani Beach", "Ukunda"] },
  { slug: "ukunda", label: "Ukunda", county: "Kwale", aliases: ["Ukunda Diani"] },
  { slug: "voi", label: "Voi", county: "Taita Taveta", aliases: ["Voi Town"] },
  { slug: "kisumu", label: "Kisumu", county: "Kisumu", aliases: ["Kisumu County"] },
  { slug: "kakamega", label: "Kakamega", county: "Kakamega", aliases: ["Kakamega Town"] },
  { slug: "busia", label: "Busia", county: "Busia", aliases: ["Busia Town"] },
  { slug: "bungoma", label: "Bungoma", county: "Bungoma", aliases: ["Bungoma Town"] },
  { slug: "webuye", label: "Webuye", county: "Bungoma", aliases: ["Webuye Town"] },
  { slug: "mumias", label: "Mumias", county: "Kakamega", aliases: ["Mumias Town"] },
  { slug: "vihiga", label: "Vihiga", county: "Vihiga", aliases: ["Vihiga Town"] },
  { slug: "siaya", label: "Siaya", county: "Siaya", aliases: ["Siaya Town"] },
  { slug: "homabay", label: "Homa Bay", county: "Homa Bay", aliases: ["Homa Bay Town"] },
  { slug: "migori", label: "Migori", county: "Migori", aliases: ["Migori Town"] },
  { slug: "kisii", label: "Kisii", county: "Kisii", aliases: ["Kisii Town"] },
  { slug: "nyamira", label: "Nyamira", county: "Nyamira", aliases: ["Nyamira Town"] },
  { slug: "meru", label: "Meru", county: "Meru", aliases: ["Meru Town"] },
  { slug: "nanyuki", label: "Nanyuki", county: "Laikipia", aliases: ["Nanyuki Town"] },
  { slug: "nyeri", label: "Nyeri", county: "Nyeri", aliases: ["Nyeri Town"] },
  { slug: "karatina", label: "Karatina", county: "Nyeri", aliases: ["Karatina Town"] },
  { slug: "muranga", label: "Murang'a", county: "Murang'a", aliases: ["Muranga", "Murang'a Town"] },
  { slug: "kerugoya", label: "Kerugoya", county: "Kirinyaga", aliases: ["Kerugoya Town"] },
  { slug: "embu", label: "Embu", county: "Embu", aliases: ["Embu Town"] },
  { slug: "chuka", label: "Chuka", county: "Tharaka Nithi", aliases: ["Chuka Town"] },
  { slug: "isiolo", label: "Isiolo", county: "Isiolo", aliases: ["Isiolo Town"] },
  { slug: "garissa", label: "Garissa", county: "Garissa", aliases: ["Garissa Town"] },
  { slug: "mandera", label: "Mandera", county: "Mandera", aliases: ["Mandera Town"] },
  { slug: "wajir", label: "Wajir", county: "Wajir", aliases: ["Wajir Town"] },
  { slug: "marsabit", label: "Marsabit", county: "Marsabit", aliases: ["Marsabit Town"] },
  { slug: "lodwar", label: "Lodwar", county: "Turkana", aliases: ["Lodwar Town"] },
  { slug: "kapenguria", label: "Kapenguria", county: "West Pokot", aliases: ["Kapenguria Town"] },
  { slug: "maralal", label: "Maralal", county: "Samburu", aliases: ["Maralal Town"] },
  { slug: "bomet", label: "Bomet", county: "Bomet", aliases: ["Bomet Town"] },
  { slug: "sotik", label: "Sotik", county: "Bomet", aliases: ["Sotik Town"] },
] as const satisfies readonly PublicRentalLocation[];

export function getPublicRentalCategory(slug: string) {
  const normalized = slug.toLowerCase();
  return PUBLIC_RENTAL_CATEGORIES.find((category) => category.slug === normalized);
}

export function getPublicRentalLocation(slug: string) {
  const normalized = slug.toLowerCase();
  return PUBLIC_RENTAL_LOCATIONS.find((location) => location.slug === normalized);
}

export function rentalLocationSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

export function buildRentalLocationTitle(location: string) {
  return `Vacant houses and rentals in ${locationLabel(location)}`;
}

export function buildRentalLocationDescription(location: string) {
  const locationInfo = getPublicRentalLocation(location);
  const locationText = locationInfo
    ? `${locationInfo.label}${locationInfo.county ? `, ${locationInfo.county}` : ""}`
    : locationLabel(location);

  return `Browse vacant houses, apartments, bedsitters, shops, offices, and rental units in ${locationText} on EstateDesk with rent, viewing details, and manager contacts.`;
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

export function publicRentalLocationPaths() {
  return PUBLIC_RENTAL_LOCATIONS.map((location) => ({
    location: location.slug,
    path: `/vacancies/${location.slug}`,
    title: buildRentalLocationTitle(location.slug),
  }));
}
