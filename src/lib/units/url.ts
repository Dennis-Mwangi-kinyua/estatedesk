type UnitSlugInput = {
  id?: string | null;
  houseNo?: string | null;
  buildingName?: string | null;
  propertyName?: string | null;
};

export function slugifyUnitPart(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getUnitSlug(unit: UnitSlugInput) {
  const parts = [
    slugifyUnitPart(unit.propertyName),
    slugifyUnitPart(unit.buildingName),
    "unit",
    slugifyUnitPart(unit.houseNo),
  ].filter(Boolean);

  return parts.join("-") || unit.id || "";
}

export function getOrgUnitHref(unit: UnitSlugInput) {
  return `/dashboard/org/units/${getUnitSlug(unit)}`;
}
