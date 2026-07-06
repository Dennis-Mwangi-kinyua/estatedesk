export function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  return date;
}

export function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function getUnitLabel(item: {
  unit?: {
    houseNo: string;
    building?: { name: string | null } | null;
    property?: { name: string | null } | null;
  } | null;
}) {
  const unit = item.unit;

  if (!unit) return "No unit assigned";

  return [
    unit.property?.name,
    unit.building?.name,
    unit.houseNo ? `Unit ${unit.houseNo}` : null,
  ]
    .filter(Boolean)
    .join(" / ");
}