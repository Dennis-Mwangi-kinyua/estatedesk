import { PropertyType } from "@prisma/client";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { formatHouseNo } from "./unit-plan-helpers";
import type { ParsedUnitPlan } from "./parse-unit-plans";
import { redirectWithError } from "./form-helpers";

type CreatePropertyInput = {
  orgId: string;
  sessionUserId: string;
  name: string;
  typeValue: PropertyType;
  location: string | null;
  address: string | null;
  notes: string | null;
  taxpayerProfileId: string | null;
  waterRatePerUnit: import("@prisma/client").Prisma.Decimal | null;
  waterFixedCharge: import("@prisma/client").Prisma.Decimal | null;
  isActive: boolean;
  landlordMode: string;
  existingLandlordProfileId: string | null;
  landlordFullName: string | null;
  landlordUsername: string | null;
  landlordPassword: string | null;
  landlordEmail: string | null;
  landlordPhone: string | null;
  landlordNationalId: string | null;
  landlordNotes: string | null;
  parsedUnitPlans: ParsedUnitPlan[];
};

export async function executeCreatePropertyTransaction(
  input: CreatePropertyInput,
) {
  await prisma.$transaction(async (tx) => {
    let landlordProfileId: string | null = null;

    if (input.landlordMode === "existing" && input.existingLandlordProfileId) {
      const landlordProfile = await tx.landlordProfile.findFirst({
        where: {
          id: input.existingLandlordProfileId,
          orgId: input.orgId,
          deletedAt: null,
          isActive: true,
        },
        select: {
          id: true,
          userId: true,
        },
      });

      if (!landlordProfile) {
        redirectWithError("The selected landlord was not found.");
      }

      landlordProfileId = landlordProfile.id;
    }

    if (input.landlordMode === "new") {
      const passwordHash = await hash(input.landlordPassword!, 12);
      const user = await tx.user.create({
        data: {
          fullName: input.landlordFullName!,
          username: input.landlordUsername,
          email: input.landlordEmail,
          phone: input.landlordPhone,
          passwordHash,
          mustChangePassword: true,
          createdByUserId: input.sessionUserId,
        },
        select: {
          id: true,
        },
      });

      const profile = await tx.landlordProfile.create({
        data: {
          orgId: input.orgId,
          userId: user.id,
          displayName: input.landlordFullName!,
          email: input.landlordEmail,
          phone: input.landlordPhone,
          nationalId: input.landlordNationalId,
          notes: input.landlordNotes,
        },
        select: {
          id: true,
        },
      });

      landlordProfileId = profile.id;
    }

    const property = await tx.property.create({
      data: {
        orgId: input.orgId,
        name: input.name,
        type: input.typeValue,
        location: input.location,
        address: input.address,
        notes: input.notes,
        taxpayerProfileId: input.taxpayerProfileId,
        waterRatePerUnit: input.waterRatePerUnit,
        waterFixedCharge: input.waterFixedCharge,
        isActive: input.isActive,
      },
    });

    if (landlordProfileId) {
      const landlordProfile = await tx.landlordProfile.findUnique({
        where: { id: landlordProfileId },
        select: { userId: true },
      });

      if (landlordProfile) {
        await tx.membership.upsert({
          where: {
            orgId_userId_role_scopeType_scopeId: {
              orgId: input.orgId,
              userId: landlordProfile.userId,
              role: "LANDLORD",
              scopeType: "PROPERTY",
              scopeId: property.id,
            },
          },
          update: {},
          create: {
            orgId: input.orgId,
            userId: landlordProfile.userId,
            role: "LANDLORD",
            scopeType: "PROPERTY",
            scopeId: property.id,
          },
        });
      }

      await tx.landlordAssignment.create({
        data: {
          orgId: input.orgId,
          landlordProfileId,
          propertyId: property.id,
          isPrimary: true,
          active: true,
          notes: "Linked during property creation.",
        },
      });
    }

    for (const plan of input.parsedUnitPlans) {
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
}