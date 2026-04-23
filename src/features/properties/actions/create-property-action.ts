"use server";

import { Prisma, PropertyType, UnitType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";

const ALLOWED_PROPERTY_TYPES: PropertyType[] = [
  "RESIDENTIAL",
  "COMMERCIAL",
  "MIXED_USE",
  "GODOWN",
];

const ALLOWED_UNIT_TYPES: UnitType[] = [
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

type ParsedUnitPlan = {
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

function redirectWithError(message: string): never {
  redirect(`/dashboard/org/properties/new?error=${encodeURIComponent(message)}`);
}

function toOptionalString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toRequiredString(
  value: FormDataEntryValue | null,
  fieldLabel: string,
): string {
  const parsed = toOptionalString(value);

  if (!parsed) {
    redirectWithError(`${fieldLabel} is required.`);
  }

  return parsed;
}

function toNonNegativeDecimal(
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

function toPositiveInteger(
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

function toNullableNonNegativeInteger(
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

function formatPlanLabel(unitType: UnitType, bedrooms: number | null) {
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

function formatHouseNo(prefix: string | null, sequenceNo: number) {
  const padded = String(sequenceNo).padStart(2, "0");
  const cleanPrefix = prefix?.trim().toUpperCase() ?? "";
  return cleanPrefix ? `${cleanPrefix}${padded}` : padded;
}

async function getAuthorizedOrgId(userId: string, activeOrgId?: string | null) {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      orgId: activeOrgId ?? undefined,
      role: {
        in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
      },
      org: {
        deletedAt: null,
        status: "ACTIVE",
      },
      user: {
        deletedAt: null,
      },
    },
    select: {
      orgId: true,
    },
  });

  if (membership) return membership.orgId;

  const fallbackMembership = await prisma.membership.findFirst({
    where: {
      userId,
      role: {
        in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
      },
      org: {
        deletedAt: null,
        status: "ACTIVE",
      },
      user: {
        deletedAt: null,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      orgId: true,
    },
  });

  if (!fallbackMembership) {
    redirect("/dashboard");
  }

  return fallbackMembership.orgId;
}

function parseUnitPlans(formData: FormData): ParsedUnitPlan[] {
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
      defaultRentAmount,
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

export async function createPropertyAction(formData: FormData) {
  const session = await requireUserSession();
  const orgId = await getAuthorizedOrgId(session.userId, session.activeOrgId);

  const name = toRequiredString(formData.get("name"), "Property name");
  const typeValue = toRequiredString(formData.get("type"), "Property type");
  const location = toOptionalString(formData.get("location"));
  const address = toOptionalString(formData.get("address"));
  const notes = toOptionalString(formData.get("notes"));
  const taxpayerProfileId = toOptionalString(formData.get("taxpayerProfileId"));
  const waterRatePerUnit = toNonNegativeDecimal(
    toOptionalString(formData.get("waterRatePerUnit")),
    "Water rate per unit",
  );
  const waterFixedCharge = toNonNegativeDecimal(
    toOptionalString(formData.get("waterFixedCharge")),
    "Water fixed charge",
  );
  const isActive = formData.get("isActive") === "on";

  if (!ALLOWED_PROPERTY_TYPES.includes(typeValue as PropertyType)) {
    redirectWithError("Please choose a valid property type.");
  }

  if (name.length > 120) {
    redirectWithError("Property name is too long.");
  }

  if (location && location.length > 160) {
    redirectWithError("Location is too long.");
  }

  if (address && address.length > 220) {
    redirectWithError("Address is too long.");
  }

  if (notes && notes.length > 1500) {
    redirectWithError("Notes are too long.");
  }

  if (taxpayerProfileId) {
    const profile = await prisma.taxpayerProfile.findFirst({
      where: {
        id: taxpayerProfileId,
        orgId,
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!profile) {
      redirectWithError("The selected taxpayer profile is invalid.");
    }
  }

  const parsedUnitPlans = parseUnitPlans(formData);

  try {
    await prisma.$transaction(async (tx) => {
      const property = await tx.property.create({
        data: {
          orgId,
          name,
          type: typeValue as PropertyType,
          location,
          address,
          notes,
          taxpayerProfileId,
          waterRatePerUnit,
          waterFixedCharge,
          isActive,
        },
      });

      for (const plan of parsedUnitPlans) {
        const createdPlan = await tx.propertyUnitPlan.create({
          data: {
            propertyId: property.id,
            unitType: plan.unitType,
            bedrooms: plan.bedrooms,
            bathrooms: plan.bathrooms,
            quantity: plan.quantity,
            defaultRentAmount: plan.defaultRentAmount,
            defaultDepositAmount: plan.defaultDepositAmount,
            houseNoPrefix: plan.houseNoPrefix,
            startNumber: plan.startNumber,
            label: plan.label,
            notes: plan.notes,
            sortOrder: plan.sortOrder,
          },
        });

        const unitsData = Array.from({ length: plan.quantity }, (_, index) => {
          const sequenceNo = plan.startNumber + index;
          const houseNo = formatHouseNo(plan.houseNoPrefix, sequenceNo);

          return {
            propertyId: property.id,
            sourcePlanId: createdPlan.id,
            houseNo,
            type: plan.unitType,
            bedrooms: plan.bedrooms,
            bathrooms: plan.bathrooms,
            rentAmount: plan.defaultRentAmount,
            depositAmount: plan.defaultDepositAmount,
            status: "VACANT" as const,
            sequenceNo,
            isActive: true,
          };
        });

        if (unitsData.length > 0) {
          await tx.unit.createMany({
            data: unitsData,
          });
        }
      }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirectWithError(
        "A property with this name already exists in this organization.",
      );
    }

    throw error;
  }

  revalidatePath("/dashboard/org");
  revalidatePath("/dashboard/org/properties");
  revalidatePath("/dashboard/org/units");

  redirect("/dashboard/org/properties?created=1");
}