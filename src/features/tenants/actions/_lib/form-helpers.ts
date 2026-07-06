import { Prisma } from "@prisma/client";

export function toOptionalString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function toRequiredString(
  value: FormDataEntryValue | null,
  fieldLabel: string,
): string {
  const parsed = toOptionalString(value);

  if (!parsed) {
    throw new Error(`${fieldLabel} is required.`);
  }

  return parsed;
}

export function toNonNegativeDecimal(
  value: string | null,
  fieldLabel: string,
): Prisma.Decimal | null {
  if (!value) return null;

  const asNumber = Number(value);

  if (Number.isNaN(asNumber)) {
    throw new Error(`${fieldLabel} must be a valid number.`);
  }

  if (asNumber < 0) {
    throw new Error(`${fieldLabel} cannot be negative.`);
  }

  return new Prisma.Decimal(value);
}

export function toOptionalInt(value: string | null, fieldLabel: string): number | null {
  if (!value) return null;

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldLabel} must be a whole number.`);
  }

  return parsed;
}