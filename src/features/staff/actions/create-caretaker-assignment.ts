"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentOrgId } from "@/lib/auth/org";

type AssignmentTargetType = "BUILDING";

function normalizeTargetType(value: string): AssignmentTargetType | null {
  const upper = value.trim().toUpperCase();

  if (upper === "BUILDING") {
    return "BUILDING";
  }

  return null;
}

export async function createCaretakerAssignment(formData: FormData) {
  const orgId = await requireCurrentOrgId();

  const caretakerUserId = String(formData.get("caretakerUserId") ?? "").trim();
  const targetType = normalizeTargetType(
    String(formData.get("targetType") ?? ""),
  );

  const buildingId = String(formData.get("buildingId") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const isPrimary = String(formData.get("isPrimary") ?? "") === "on";

  if (!caretakerUserId) {
    throw new Error("Caretaker is required.");
  }

  if (!targetType) {
    throw new Error("Select the apartment/block this caretaker manages.");
  }

  const caretakerMembership = await prisma.membership.findFirst({
    where: {
      orgId,
      userId: caretakerUserId,
      role: "CARETAKER",
      employmentEndedAt: null,
      user: {
        is: {
          deletedAt: null,
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (!caretakerMembership) {
    throw new Error("Selected user is not a caretaker in this organisation.");
  }

  const target = await resolveAssignmentTarget({
    orgId,
    targetType,
    buildingId,
  });

  const existingAssignment = await prisma.caretakerAssignment.findFirst({
    where: {
      orgId,
      caretakerUserId,
      propertyId: target.propertyId,
      buildingId: target.buildingId,
      unitId: target.unitId,
      active: true,
    },
    select: {
      id: true,
    },
  });

  if (existingAssignment) {
    throw new Error("This caretaker already has this active assignment.");
  }

  await prisma.caretakerAssignment.create({
    data: {
      orgId,
      caretakerUserId,
      propertyId: target.propertyId,
      buildingId: target.buildingId,
      unitId: target.unitId,
      isPrimary,
      notes: notes || null,
      active: true,
    },
  });

  revalidatePath("/staff/caretaker");
  revalidatePath(`/staff/caretaker/${caretakerMembership.id}`);
}

export async function endCaretakerAssignment(formData: FormData) {
  const orgId = await requireCurrentOrgId();

  const assignmentId = String(formData.get("assignmentId") ?? "").trim();
  const membershipId = String(formData.get("membershipId") ?? "").trim();

  if (!assignmentId) {
    throw new Error("Assignment is required.");
  }

  await prisma.caretakerAssignment.updateMany({
    where: {
      id: assignmentId,
      orgId,
      active: true,
    },
    data: {
      active: false,
      endedAt: new Date(),
    },
  });

  revalidatePath("/staff/caretaker");

  if (membershipId) {
    revalidatePath(`/staff/caretaker/${membershipId}`);
  }
}

async function resolveAssignmentTarget({
  orgId,
  targetType,
  buildingId,
}: {
  orgId: string;
  targetType: AssignmentTargetType;
  buildingId: string;
}) {
  if (targetType !== "BUILDING" || !buildingId) {
    throw new Error("Apartment/block is required.");
  }

  const building = await prisma.building.findFirst({
    where: {
      id: buildingId,
      deletedAt: null,
      isActive: true,
      property: {
        orgId,
        deletedAt: null,
        isActive: true,
      },
    },
    select: {
      id: true,
      propertyId: true,
    },
  });

  if (!building) {
    throw new Error("Apartment/block was not found.");
  }

  return {
    propertyId: building.propertyId,
    buildingId: building.id,
    unitId: null,
  };
}
