import { resolvePublicRentalLocationHref } from "../public-rental-seo";

export const rentalCategoryTypes: Record<string, string> = {
  bedsitters: "BEDSITTER", studios: "STUDIO", "single-rooms": "SINGLE_ROOM",
  apartments: "APARTMENT", shops: "SHOP", offices: "OFFICE",
  stalls: "STALL", warehouses: "WAREHOUSE", godowns: "GODOWN",
};

export function rentalCategoryType(category: string) {
  return Object.hasOwn(rentalCategoryTypes, category) ? rentalCategoryTypes[category] : undefined;
}

/** Only advertise working location routes backed by published inventory. */
export function rentalInventorySitemapEntries(units: Array<{ type: string; updatedAt: Date; property: { location: string | null; address: string | null; name: string } }>) {
  const entries = new Map<string, string>();
  const categories = new Map(Object.entries(rentalCategoryTypes).map(([slug, type]) => [type, slug]));
  function add(path: string, date: string) {
    if (!entries.has(path) || entries.get(path)! < date) entries.set(path, date);
  }
  for (const unit of units) {
    const location = unit.property.location || unit.property.address || unit.property.name;
    const path = resolvePublicRentalLocationHref(location);
    if (!/^\/vacancies\/[^/?]+$/.test(path)) continue;
    const date = unit.updatedAt.toISOString().slice(0, 10);
    add(path, date);
    const category = categories.get(unit.type);
    if (category) add(`${path}/${category}`, date);
  }
  return entries;
}
