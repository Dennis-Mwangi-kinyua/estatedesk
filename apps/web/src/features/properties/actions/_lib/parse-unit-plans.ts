import { Prisma, PropertyType, UnitType } from "@prisma/client";
import {
  redirectWithError,
  toNonNegativeDecimal,
  toNullableNonNegativeInteger,
  toPositiveInteger,
} from "./form-helpers";
import { formatHouseNo, formatPlanLabel } from "./unit-plan-helpers";

export const ALLOWED_PROPERTY_TYPES: PropertyType[] = [
  "RESIDENTIAL",
  "COMMERCIAL",
  "MIXED_USE",
  "GODOWN",
];

export const ALLOWED_UNIT_TYPES: UnitType[] = [
  "APARTMENT",
  "BEDSITTER",
  "STUDIO",
  "SINGLE_ROOM",
  "SHOP",
  "OFFICE",
  "STALL",
  "WAREHOUSE",
  "GODOWN",
];

export type ParsedUnitPlan = {
  unitType: UnitType;
  bedrooms: number | null;
  bathrooms: number | null;
  quantity: number;
  defaultRentAmount: Prisma.Decimal;
  defaultDepositAmount: Prisma.Decimal | null;
  houseNoPrefix: string | null;
  startNumber: number;
  label: string | null;
  notes: string | null;
  sortOrder: number;
};

export function parseUnitPlans(formData: FormData): ParsedUnitPlan[] {
  const unitTypes = formData
    .getAll("unitPlanUnitType[]")
    .map((value) => (typeof value === "string" ? value.trim() : ""));

  const bedrooms = formData
    .getAll("unitPlanBedrooms[]")
    .map((value) => (typeof value === "string" ? value.trim() : ""));

  const bathrooms = formData
    .getAll("unitPlanBathrooms[]")
    .map((value) => (typeof value === "string" ? value.trim() : ""));

  const quantities = formData
    .getAll("unitPlanQuantity[]")
    .map((value) => (typeof value === "string" ? value.trim() : ""));

  const defaultRents = formData
    .getAll("unitPlanDefaultRentAmount[]")
    .map((value) => (typeof value === "string" ? value.trim() : ""));

  const defaultDeposits = formData
    .getAll("unitPlanDefaultDepositAmount[]")
    .map((value) => (typeof value === "string" ? value.trim() : ""));

  const prefixes = formData
    .getAll("unitPlanHouseNoPrefix[]")
    .map((value) => (typeof value === "string" ? value.trim() : ""));

  const startNumbers = formData
    .getAll("unitPlanStartNumber[]")
    .map((value) => (typeof value === "string" ? value.trim() : ""));

  const labels = formData
    .getAll("unitPlanLabel[]")
    .map((value) => (typeof value === "string" ? value.trim() : ""));

  const notes = formData
    .getAll("unitPlanNotes[]")
    .map((value) => (typeof value === "string" ? value.trim() : ""));

  const rowCount = unitTypes.length;
  const parsed: ParsedUnitPlan[] = [];
  const seenHouseNos = new Set<string>();

  for (let index = 0; index < rowCount; index += 1) {
    const unitTypeRaw = unitTypes[index] ?? "";
    const bedroomsRaw = bedrooms[index] ?? "";
    const bathroomsRaw = bathrooms[index] ?? "";
    const quantityRaw = quantities[index] ?? "";
    const rentRaw = defaultRents[index] ?? "";
    const depositRaw = defaultDeposits[index] ?? "";
    const prefixRaw = prefixes[index] ?? "";
    const startNumberRaw = startNumbers[index] ?? "";
    const labelRaw = labels[index] ?? "";
    const noteRaw = notes[index] ?? "";

    const isCompletelyBlank =
      !unitTypeRaw &&
      !bedroomsRaw &&
      !bathroomsRaw &&
      !quantityRaw &&
      !rentRaw &&
      !depositRaw &&
      !prefixRaw &&
      !startNumberRaw &&
      !labelRaw &&
      !noteRaw;

    if (isCompletelyBlank) {
      continue;
    }

    if (!ALLOWED_UNIT_TYPES.includes(unitTypeRaw as UnitType)) {
      redirectWithError(`Unit mix row ${index + 1} has an invalid unit type.`);
    }

    const unitType = unitTypeRaw as UnitType;
    const quantity = toPositiveInteger(
      quantityRaw || null,
      `Quantity on unit mix row ${index + 1}`,
    );
    const startNumber = toPositiveInteger(
      startNumberRaw || null,
      `Start number on unit mix row ${index + 1}`,
      1,
    );
    const defaultRentAmount = toNonNegativeDecimal(
      rentRaw || null,
      `Default rent on unit mix row ${index + 1}`,
    );

    if (!defaultRentAmount) {
      redirectWithError(`Default rent is required on unit mix row ${index + 1}.`);
    }

    const defaultDepositAmount = toNonNegativeDecimal(
      depositRaw || null,
      `Default deposit on unit mix row ${index + 1}`,
    );

    const bathroomsValue = toNullableNonNegativeInteger(
      bathroomsRaw || null,
      `Bathrooms on unit mix row ${index + 1}`,
    );

    let bedroomsValue: number | null = null;

    if (unitType === "APARTMENT") {
      const parsedBedrooms = toPositiveInteger(
        bedroomsRaw || null,
        `Bedrooms on unit mix row ${index + 1}`,
      );

      if (![1, 2, 3, 4].includes(parsedBedrooms)) {
        redirectWithError(
          `Apartment bedrooms on unit mix row ${index + 1} must be 1, 2, 3, or 4.`,
        );
      }

      bedroomsValue = parsedBedrooms;
    }

    if (unitType !== "APARTMENT" && bedroomsRaw) {
      redirectWithError(
        `Bedrooms should only be set for apartment rows. Check unit mix row ${
          index + 1
        }.`,
      );
    }

    const normalizedPrefix = prefixRaw ? prefixRaw.toUpperCase() : null;

    for (let step = 0; step < quantity; step += 1) {
      const sequenceNo = startNumber + step;
      const houseNo = formatHouseNo(normalizedPrefix, sequenceNo);

      if (seenHouseNos.has(houseNo.toLowerCase())) {
        redirectWithError(
          `Duplicate generated house number "${houseNo}" detected. Adjust the prefix or start number in your unit mix.`,
        );
      }

      seenHouseNos.add(houseNo.toLowerCase());
    }

    parsed.push({
      unitType,
      bedrooms: bedroomsValue,
      bathrooms: bathroomsValue,
      quantity,
      defaultRentAmount: defaultRentAmount!,
      defaultDepositAmount,
      houseNoPrefix: normalizedPrefix,
      startNumber,
      label: labelRaw || formatPlanLabel(unitType, bedroomsValue),
      notes: noteRaw || null,
      sortOrder: index,
    });
  }

  return parsed;
}