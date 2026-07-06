import { UnitType } from "@prisma/client";

export function formatPlanLabel(unitType: UnitType, bedrooms: number | null) {
  if (unitType === "APARTMENT" && bedrooms) {
    return `${bedrooms} Bedroom Apartment`;
  }

  switch (unitType) {
    case "BEDSITTER":
      return "Bedsitter";
    case "STUDIO":
      return "Studio";
    case "SINGLE_ROOM":
      return "Single Room";
    case "SHOP":
      return "Shop";
    case "OFFICE":
      return "Office";
    case "STALL":
      return "Stall";
    case "WAREHOUSE":
      return "Warehouse";
    case "GODOWN":
      return "Godown";
    default:
      return "Unit";
  }
}

export function formatHouseNo(prefix: string | null, sequenceNo: number) {
  const padded = String(sequenceNo).padStart(2, "0");
  const cleanPrefix = prefix?.trim().toUpperCase() ?? "";
  return cleanPrefix ? `${cleanPrefix}${padded}` : padded;
}