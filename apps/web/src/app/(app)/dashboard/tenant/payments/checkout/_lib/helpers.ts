export function formatSource(source: string | null) {
  if (!source) return "Tenant Bill";
  if (source === "water_bill") return "Water Bill";
  if (source === "rent_charge") return "Rent / Charge";
  if (source === "advance_rent") return "Advance Rent";
  return source.replaceAll("_", " ");
}