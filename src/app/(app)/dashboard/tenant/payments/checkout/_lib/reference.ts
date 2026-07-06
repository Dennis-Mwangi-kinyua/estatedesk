export function normalizeReferencePart(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 18);
}

export function getReferencePrefix(source: string) {
  if (source === "water_bill") return "WB";
  if (source === "rent_charge") return "RC";
  if (source === "advance_rent") return "AR";
  return "PMT";
}

export function buildPaymentReference({
  source,
  period,
  unitLabel,
}: {
  source: string;
  period: string;
  unitLabel: string;
}) {
  const prefix = getReferencePrefix(source);
  const unit = normalizeReferencePart(unitLabel) || "UNIT";
  return `${prefix}-${period}-${unit}`;
}

export function mapPaymentMethod(method: string) {
  if (method === "mpesa") return "MPESA_MANUAL" as const;
  if (method === "cash") return "CASH" as const;
  return "BANK" as const;
}