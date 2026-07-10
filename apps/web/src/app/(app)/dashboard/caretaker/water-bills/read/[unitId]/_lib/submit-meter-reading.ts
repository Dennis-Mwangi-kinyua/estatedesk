"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCaretakerAllowedUnitIds } from "@/lib/caretaker/access";
import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { encodePublicId } from "@/lib/public-id";
import { parseInteger } from "./helpers";
import type { SubmitMeterReadingState } from "./types";
import { uploadMeterPhoto } from "./upload-meter-photo";

export async function submitMeterReading(
  _prevState: SubmitMeterReadingState,
  formData: FormData
): Promise<SubmitMeterReadingState> {
  const session = await requireCaretakerAccess();

  const unitId = formData.get("unitId");
  const period = formData.get("period");
  const notes = formData.get("notes");
  const photo = formData.get("photo");

  const prevReading = parseInteger(formData.get("prevReading"));
  const currentReading = parseInteger(formData.get("currentReading"));

  const fieldErrors: SubmitMeterReadingState["fieldErrors"] = {};

  if (typeof unitId !== "string" || !unitId.trim()) {
    return { error: "Missing unit." };
  }

  if (typeof period !== "string" || !period.trim()) {
    return { error: "Missing billing period." };
  }

  const allowedUnitIds = await getCaretakerAllowedUnitIds({
    orgId: session.activeOrgId!,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
  });

  if (!allowedUnitIds.includes(unitId)) {
    return {
      error: "You can only submit water readings for units assigned to you.",
    };
  }

  if (prevReading === null) {
    fieldErrors.prevReading = "Enter a valid previous reading.";
  }

  if (currentReading === null) {
    fieldErrors.currentReading = "Enter a valid current reading.";
  }

  if (typeof notes === "string" && notes.length > 500) {
    fieldErrors.notes = "Notes must be 500 characters or less.";
  }

  if (photo instanceof File && photo.size > 0) {
    if (!photo.type.startsWith("image/")) {
      fieldErrors.photo = "Upload an image file.";
    }

    if (photo.size > 5 * 1024 * 1024) {
      fieldErrors.photo = "Photo must be 5MB or smaller.";
    }
  }

  if (
    fieldErrors.prevReading ||
    fieldErrors.currentReading ||
    fieldErrors.photo ||
    fieldErrors.notes
  ) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  if (prevReading! < 0) {
    return {
      error: "Previous reading cannot be negative.",
      fieldErrors: {
        prevReading: "Previous reading cannot be negative.",
      },
    };
  }

  if (currentReading! < 0) {
    return {
      error: "Current reading cannot be negative.",
      fieldErrors: {
        currentReading: "Current reading cannot be negative.",
      },
    };
  }

  if (currentReading! < prevReading!) {
    return {
      error: "Current reading cannot be less than previous reading.",
      fieldErrors: {
        currentReading: "Current reading must be greater than or equal to previous reading.",
      },
    };
  }

  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    select: {
      id: true,
      isActive: true,
      status: true,
      leases: {
        where: { status: "ACTIVE" },
        take: 1,
        select: { id: true },
      },
    },
  });

  if (!unit || !unit.isActive || unit.status !== "OCCUPIED") {
    return {
      error: "This unit is not available for water meter submission.",
    };
  }

  if (!unit.leases.length) {
    return {
      error: "This unit has no active lease, so a meter reading cannot be submitted.",
    };
  }

  const existingReading = await prisma.meterReading.findUnique({
    where: {
      unitId_period: {
        unitId,
        period,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingReading) {
    return {
      error: "A meter reading has already been submitted for this unit and period.",
    };
  }

  const unitsUsed = currentReading! - prevReading!;
  let photoAssetId: string | undefined;

  const submittedByUserId =
    // adjust this line only if your session shape uses a different id field
    (session as { userId?: string; id?: string }).userId ??
    (session as { userId?: string; id?: string }).id;

  if (!submittedByUserId) {
    return {
      error: "Could not determine the signed-in caretaker.",
    };
  }

  if (photo instanceof File && photo.size > 0) {
    photoAssetId = await uploadMeterPhoto({
      photo,
      unitId,
      period,
      orgId: session.activeOrgId!,
      submittedByUserId,
    });
  }

  const reading = await prisma.meterReading.create({
    data: {
      unitId,
      period,
      prevReading: prevReading!,
      currentReading: currentReading!,
      unitsUsed,
      submittedByUserId,
      photoAssetId,
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
    },
    select: {
      id: true,
    },
  });

  redirect(
    `/dashboard/caretaker/water-bills/readings/${encodePublicId(
      reading.id,
      "meter-reading",
    )}`,
  );
}