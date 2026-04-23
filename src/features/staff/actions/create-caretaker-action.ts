"use server";

import { Prisma, OrgRole, ScopeType, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { requireCurrentOrgId } from "@/lib/auth/org";

type CreateCaretakerState = {
  error: string | null;
};

export async function createCaretakerAction(
  _prevState: CreateCaretakerState,
  formData: FormData,
): Promise<CreateCaretakerState> {
  const session = await requireUserSession();
  const orgId = await requireCurrentOrgId();
  const actorUserId = session.userId;

  const fullName = String(formData.get("fullName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const emailRaw = String(formData.get("email") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const propertyIdRaw = String(formData.get("propertyId") ?? "").trim();
  const buildingIdRaw = String(formData.get("buildingId") ?? "").trim();
  const unitIdRaw = String(formData.get("unitId") ?? "").trim();
  const notesRaw = String(formData.get("notes") ?? "").trim();
  const isPrimary = String(formData.get("isPrimary") ?? "") === "true";

  const email = emailRaw || null;
  const phone = phoneRaw || null;
  const propertyId = propertyIdRaw || null;
  const buildingId = buildingIdRaw || null;
  const unitId = unitIdRaw || null;
  const notes = notesRaw || null;

  if (!fullName) {
    return { error: "Full name is required." };
  }

  if (!username) {
    return { error: "Username is required." };
  }

  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (!email && !phone) {
    return { error: "Provide at least an email or phone number." };
  }

  const [property, building, unit] = await Promise.all([
    propertyId
      ? prisma.property.findFirst({
          where: {
            id: propertyId,
            orgId,
            deletedAt: null,
            isActive: true,
          },
          select: {
            id: true,
          },
        })
      : Promise.resolve(null),
    buildingId
      ? prisma.building.findFirst({
          where: {
            id: buildingId,
            deletedAt: null,
            isActive: true,
            property: {
              orgId,
              deletedAt: null,
            },
          },
          select: {
            id: true,
            propertyId: true,
          },
        })
      : Promise.resolve(null),
    unitId
      ? prisma.unit.findFirst({
          where: {
            id: unitId,
            deletedAt: null,
            isActive: true,
            property: {
              orgId,
              deletedAt: null,
            },
          },
          select: {
            id: true,
            propertyId: true,
            buildingId: true,
          },
        })
      : Promise.resolve(null),
  ]);

  if (propertyId && !property) {
    return { error: "Selected property was not found." };
  }

  if (buildingId && !building) {
    return { error: "Selected building was not found." };
  }

  if (unitId && !unit) {
    return { error: "Selected apartment / unit was not found." };
  }

  if (propertyId && building && building.propertyId !== propertyId) {
    return { error: "Selected building does not belong to the chosen property." };
  }

  if (propertyId && unit && unit.propertyId !== propertyId) {
    return { error: "Selected apartment / unit does not belong to the chosen property." };
  }

  if (buildingId && unit && unit.buildingId !== buildingId) {
    return { error: "Selected apartment / unit does not belong to the chosen building." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Replace this with your existing password hashing helper.
      // It must match the same format used by your login verification flow.
      const passwordHash = password;

      const user = await tx.user.create({
        data: {
          fullName,
          username,
          email,
          phone,
          passwordHash,
          status: UserStatus.ACTIVE,
          createdByUserId: actorUserId,
        },
        select: {
          id: true,
        },
      });

      const membership = await tx.membership.create({
        data: {
          orgId,
          userId: user.id,
          role: OrgRole.CARETAKER,
          scopeType: ScopeType.ORG,
          scopeId: "ORG_SCOPE",
        },
        select: {
          id: true,
        },
      });

      if (propertyId || buildingId || unitId) {
        await tx.caretakerAssignment.create({
          data: {
            orgId,
            caretakerUserId: user.id,
            propertyId,
            buildingId,
            unitId,
            isPrimary,
            active: true,
            notes,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          orgId,
          actorUserId,
          action: "CARETAKER_CREATED",
          entityType: "Membership",
          entityId: membership.id,
          metadata: {
            fullName,
            username,
            email,
            phone,
            propertyId,
            buildingId,
            unitId,
            isPrimary,
          },
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          error: "A caretaker with the same username, email, or phone already exists.",
        };
      }
    }

    const message =
      error instanceof Error ? error.message : "Failed to create caretaker.";

    return { error: message };
  }

  revalidatePath("/staff");
  revalidatePath("/staff/caretaker");
  redirect("/staff/caretaker");
}