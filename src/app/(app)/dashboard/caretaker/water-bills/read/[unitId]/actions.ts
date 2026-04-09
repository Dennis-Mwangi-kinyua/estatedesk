"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCaretakerAccess } from "@/lib/permissions/guards";

export type SubmitMeterReadingState = {
  error?: string;
  success?: string;
  fieldErrors?: {
    prevReading?: string;
    currentReading?: string;
    notes?: string;
  };
};

function parseInteger(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);

  if (!Number.isInteger(parsed)) return null;
  return parsed;
}

export async function submitMeterReading(
  _prevState: SubmitMeterReadingState,
  formData: FormData
): Promise<SubmitMeterReadingState> {
  const session = await requireCaretakerAccess();

  const unitId = formData.get("unitId");
  const period = formData.get("period");
  const notes = formData.get("notes");

  const prevReading = parseInteger(formData.get("prevReading"));
  const currentReading = parseInteger(formData.get("currentReading"));

  const fieldErrors: SubmitMeterReadingState["fieldErrors"] = {};

  if (typeof unitId !== "string" || !unitId.trim()) {
    return { error: "Missing unit." };
  }

  if (typeof period !== "string" || !period.trim()) {
    return { error: "Missing billing period." };
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

  if (fieldErrors.prevReading || fieldErrors.currentReading || fieldErrors.notes) {
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

  const submittedByUserId =
    // adjust this line only if your session shape uses a different id field
    (session as { userId?: string; id?: string }).userId ??
    (session as { userId?: string; id?: string }).id;

  if (!submittedByUserId) {
    return {
      error: "Could not determine the signed-in caretaker.",
    };
  }

  const reading = await prisma.meterReading.create({
    data: {
      unitId,
      period,
      prevReading: prevReading!,
      currentReading: currentReading!,
      unitsUsed,
      submittedByUserId,
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
      // status defaults to SUBMITTED in your schema
    },
    select: {
      id: true,
    },
  });

  redirect(`/dashboard/caretaker/water-bills/readings/${reading.id}`);
}