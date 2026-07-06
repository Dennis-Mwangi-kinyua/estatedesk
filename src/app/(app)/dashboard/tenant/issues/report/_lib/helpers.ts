export function getErrorMessage(error?: string) {
  switch (error) {
    case "missing_fields":
      return "Please fill in the title, unit, and description.";
    case "invalid_unit":
      return "The selected unit is not available for your tenant account.";
    case "tenant_not_found":
      return "We could not verify your tenant profile.";
    default:
      return null;
  }
}

export function unitLabel(unit: {
  id: string;
  houseNo: string;
  property: { name: string };
  building: { name: string } | null;
}) {
  return `${unit.property.name} • Unit ${unit.houseNo}${
    unit.building?.name ? ` • ${unit.building.name}` : ""
  }`;
}