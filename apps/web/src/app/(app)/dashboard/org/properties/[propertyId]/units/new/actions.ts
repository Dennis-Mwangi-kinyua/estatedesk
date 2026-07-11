"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UnitStatus, UnitType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertCanCreateUnit } from "@/lib/billing/access";
import { requireOrgPermission } from "@/lib/permissions/guards";
import { revalidatePublicVacancies } from "@/lib/public-vacancy-cache";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readOptionalNumber(formData: FormData, key: string) {
  const raw = readString(formData, key);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export async function createUnitAction(formData: FormData) {
  const session = await requireOrgPermission("properties.manage");
  const orgId = session.activeOrgId!;
  const propertyId = readString(formData, "propertyId");
  const houseNo = readString(formData, "houseNo");
  const buildingId = readString(formData, "buildingId") || null;
  const typeRaw = readString(formData, "type") || UnitType.APARTMENT;
  const statusRaw = readString(formData, "status") || UnitStatus.VACANT;
  const bedrooms = readOptionalNumber(formData, "bedrooms");
  const bathrooms = readOptionalNumber(formData, "bathrooms");
  const floorArea = readOptionalNumber(formData, "floorArea");
  const rentAmount = readOptionalNumber(formData, "rentAmount");
  const depositAmount = readOptionalNumber(formData, "depositAmount");
  const vacantSince = readString(formData, "vacantSince");
  const notes = readString(formData, "notes") || null;
  const isActive = formData.get("isActive") === "on";

  if (!propertyId) {
    throw new Error("Property is required.");
  }

  if (!houseNo) {
    throw new Error("Unit / house number is required.");
  }

  if (!Object.values(UnitType).includes(typeRaw as UnitType)) {
    throw new Error("Invalid unit type.");
  }

  if (!Object.values(UnitStatus).includes(statusRaw as UnitStatus)) {
    throw new Error("Invalid unit status.");
  }

  const property = await prisma.property.findFirst({
    where: { id: propertyId, orgId, deletedAt: null },
    select: { id: true, name: true },
  });

  if (!property) {
    throw new Error("Property not found.");
  }

  if (buildingId) {
    const building = await prisma.building.findFirst({
      where: { id: buildingId, propertyId, deletedAt: null },
      select: { id: true },
    });
    if (!building) {
      throw new Error("Building not found on this property.");
    }
  }

  try {
    await assertCanCreateUnit(orgId);
  } catch (error) {
    redirect(
      `/dashboard/org/properties/${propertyId}/units/new?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Unit plan limit reached.",
      )}`,
    );
  }

  try {
    const unit = await prisma.unit.create({
      data: {
        propertyId,
        buildingId,
        houseNo,
        type: typeRaw as UnitType,
        status: statusRaw as UnitStatus,
        bedrooms: bedrooms !== null ? Math.trunc(bedrooms) : null,
        bathrooms: bathrooms !== null ? Math.trunc(bathrooms) : null,
        floorArea: floorArea ?? undefined,
        rentAmount:
          rentAmount !== null
            ? new Prisma.Decimal(rentAmount)
            : new Prisma.Decimal(0),
        depositAmount:
          depositAmount !== null ? new Prisma.Decimal(depositAmount) : undefined,
        vacantSince: vacantSince ? new Date(vacantSince) : null,
        notes,
        isActive,
      },
      select: { id: true, houseNo: true },
    });

    revalidatePath("/dashboard/org/units");
    revalidatePath(`/dashboard/org/properties/${propertyId}`);
    revalidatePublicVacancies({
      unitId: unit.id,
      propertyName: property.name,
      houseNo: unit.houseNo,
    });

    redirect(`/dashboard/org/units/${unit.id}`);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirect(
        `/dashboard/org/properties/${propertyId}/units/new?error=${encodeURIComponent(
          "A unit with this house number already exists on the property.",
        )}`,
      );
    }
    throw error;
  }
}
