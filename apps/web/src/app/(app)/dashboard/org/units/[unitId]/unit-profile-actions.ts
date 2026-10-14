"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit/security";
import { logServerError } from "@/lib/errors/server-error-log";
import { requireOrgRole } from "@/lib/permissions/guards";
import { revalidatePublicVacancies } from "@/lib/public-vacancy-cache";
import { prisma } from "@/lib/prisma";

export type UnitProfileActionState = { error?: string; message?: string };

class UnitProfileEditError extends Error {}

const optionalNumber = (schema: z.ZodType<number, unknown>) => z.preprocess(
  value => value === "" || value === null || value === undefined ? null : value,
  schema.nullable(),
);
const money = z.coerce.number().finite().min(0).max(9_999_999_999.99)
  .refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.0001, "Use at most two decimal places.");
const unitProfileSchema = z.object({
  expectedUpdatedAt: z.string().datetime(),
  houseNo: z.string().trim().min(1, "Enter a unit name or number.").max(80),
  sequenceNo: optionalNumber(z.coerce.number().int().min(0).max(999_999)),
  type: z.enum(["APARTMENT", "BEDSITTER", "SHOP", "OFFICE", "STALL", "WAREHOUSE", "GODOWN", "STUDIO", "SINGLE_ROOM"]),
  bedrooms: optionalNumber(z.coerce.number().int().min(0).max(100)),
  bathrooms: optionalNumber(z.coerce.number().int().min(0).max(100)),
  roomCount: optionalNumber(z.coerce.number().int().min(0).max(100)),
  floorArea: optionalNumber(z.coerce.number().finite().min(0.01).max(1_000_000)),
  rentAmount: money.refine(value => value > 0, "Rent must be greater than zero."),
  depositAmount: optionalNumber(money),
  serviceCharge: optionalNumber(money),
  garbageFee: optionalNumber(money),
  securityFee: optionalNumber(money),
  electricityBilling: z.union([z.literal(""), z.enum(["Prepay", "Postpay", "Included"])]).transform(value => value || null),
  hasBalcony: z.boolean(),
  notes: z.string().trim().max(5000).transform(value => value || null),
});

export async function updateUnitProfileAction(
  unitId: string,
  _state: UnitProfileActionState,
  formData: FormData,
): Promise<UnitProfileActionState> {
  const session = await requireOrgRole(["ADMIN", "MANAGER"]);
  const parsed = unitProfileSchema.safeParse({
    ...Object.fromEntries(formData),
    hasBalcony: formData.get("hasBalcony") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the unit details and try again." };
  const data = parsed.data;
  const orgId = session.activeOrgId;
  if (!orgId) return { error: "Select an organisation first." };

  try {
    const changed = await prisma.$transaction(async tx => {
      const unit = await tx.unit.findFirst({
        where: { id: unitId, deletedAt: null, property: { orgId, deletedAt: null } },
        select: {
          id: true,
          propertyId: true,
          houseNo: true,
          buildingId: true,
          publicSlug: true,
          updatedAt: true,
          sequenceNo: true,
          type: true,
          bedrooms: true,
          bathrooms: true,
          roomCount: true,
          floorArea: true,
          rentAmount: true,
          depositAmount: true,
          serviceCharge: true,
          garbageFee: true,
          securityFee: true,
          electricityBilling: true,
          hasBalcony: true,
          notes: true,
          property: { select: { name: true } },
        },
      });
      if (!unit) throw new UnitProfileEditError("This unit is not available in your organisation.");
      if (unit.updatedAt.toISOString() !== data.expectedUpdatedAt) {
        throw new UnitProfileEditError("This unit changed while you were editing it. Refresh the page and try again.");
      }

      const duplicate = await tx.unit.findFirst({
        where: {
          propertyId: unit.propertyId,
          buildingId: unit.buildingId,
          id: { not: unit.id },
          deletedAt: null,
          houseNo: { equals: data.houseNo, mode: "insensitive" },
        },
        select: { id: true },
      });
      if (duplicate) throw new UnitProfileEditError("That unit name or number is already used in this building.");

      await tx.unit.update({
        where: { id: unit.id },
        data: {
          houseNo: data.houseNo,
          sequenceNo: data.sequenceNo,
          type: data.type,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          roomCount: data.roomCount,
          floorArea: data.floorArea,
          rentAmount: new Prisma.Decimal(data.rentAmount),
          depositAmount: data.depositAmount === null ? null : new Prisma.Decimal(data.depositAmount),
          serviceCharge: data.serviceCharge === null ? null : new Prisma.Decimal(data.serviceCharge),
          garbageFee: data.garbageFee === null ? null : new Prisma.Decimal(data.garbageFee),
          securityFee: data.securityFee === null ? null : new Prisma.Decimal(data.securityFee),
          electricityBilling: data.electricityBilling,
          hasBalcony: data.hasBalcony,
          notes: data.notes,
        },
      });
      return {
        unitId: unit.id,
        propertyName: unit.property.name,
        before: {
          houseNo: unit.houseNo,
          sequenceNo: unit.sequenceNo,
          type: unit.type,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
          roomCount: unit.roomCount,
          floorArea: unit.floorArea,
          rentAmount: String(unit.rentAmount),
          depositAmount: unit.depositAmount === null ? null : String(unit.depositAmount),
          serviceCharge: unit.serviceCharge === null ? null : String(unit.serviceCharge),
          garbageFee: unit.garbageFee === null ? null : String(unit.garbageFee),
          securityFee: unit.securityFee === null ? null : String(unit.securityFee),
          electricityBilling: unit.electricityBilling,
          hasBalcony: unit.hasBalcony,
          notes: unit.notes,
        },
        after: {
          houseNo: data.houseNo,
          sequenceNo: data.sequenceNo,
          type: data.type,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          roomCount: data.roomCount,
          floorArea: data.floorArea,
          rentAmount: data.rentAmount,
          depositAmount: data.depositAmount,
          serviceCharge: data.serviceCharge,
          garbageFee: data.garbageFee,
          securityFee: data.securityFee,
          electricityBilling: data.electricityBilling,
          hasBalcony: data.hasBalcony,
          notes: data.notes,
        },
        oldHouseNo: unit.houseNo,
        newHouseNo: data.houseNo,
        publicSlug: unit.publicSlug,
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15_000 });

    await writeAuditLog({
      orgId,
      actorUserId: session.userId,
      action: "UNIT_PROFILE_UPDATED",
      entityType: "Unit",
      entityId: changed.unitId,
      beforeState: changed.before,
      afterState: changed.after,
    });
    revalidatePath("/dashboard/org/units");
    revalidatePath(`/dashboard/org/units/${changed.unitId}`);
    revalidatePath("/dashboard/tenant", "layout");
    revalidatePublicVacancies({ propertyName: changed.propertyName, houseNo: changed.oldHouseNo, publicSlug: changed.publicSlug });
    revalidatePublicVacancies({ propertyName: changed.propertyName, houseNo: changed.newHouseNo, publicSlug: changed.publicSlug });
    return { message: "Unit details saved." };
  } catch (error) {
    if (error instanceof UnitProfileEditError) return { error: error.message };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return { error: "This unit changed during saving. Refresh the page and try again." };
    }
    logServerError("org.units.updateProfile", error);
    return { error: "Could not save the unit details. Please try again." };
  }
}
