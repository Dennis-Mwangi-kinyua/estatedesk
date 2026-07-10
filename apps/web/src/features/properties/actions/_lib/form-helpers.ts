import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";

export function redirectWithError(message: string): never {
  redirect(`/dashboard/org/properties/new?error=${encodeURIComponent(message)}`);
}

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
    redirectWithError(`${fieldLabel} is required.`);
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
    redirectWithError(`${fieldLabel} must be a valid number.`);
  }

  if (asNumber < 0) {
    redirectWithError(`${fieldLabel} cannot be negative.`);
  }

  return new Prisma.Decimal(value);
}

export function toPositiveInteger(
  value: string | null,
  fieldLabel: string,
  fallback?: number,
): number {
  if (!value) {
    if (fallback !== undefined) return fallback;
    redirectWithError(`${fieldLabel} is required.`);
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    redirectWithError(`${fieldLabel} must be a positive whole number.`);
  }

  return parsed;
}

export function toNullableNonNegativeInteger(
  value: string | null,
  fieldLabel: string,
): number | null {
  if (!value) return null;

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    redirectWithError(`${fieldLabel} must be zero or greater.`);
  }

  return parsed;
}

export function normalizeUsername(value: string | null) {
  return value?.trim().toLowerCase().replace(/\s+/g, "") ?? null;
}

export function normalizeEmail(value: string | null) {
  return value?.trim().toLowerCase() ?? null;
}

export function normalizePhone(value: string | null) {
  return value?.replace(/\s+/g, "").trim() ?? null;
}