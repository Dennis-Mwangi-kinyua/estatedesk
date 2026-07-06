"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCaretakerManagedBuildingUnitIds } from "@/lib/caretaker/access";
import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { addDays, parseInteger } from "./helpers";
import { notifyOrgReviewers } from "./notify-org-reviewers";
import type { QuickMeterReadingState } from "./types";
import { uploadMeterPhoto } from "./upload-meter-photo";

export async function quickSubmitMeterReading(
  prevState: QuickMeterReadingState,
  formData: FormData,
): Promise<QuickMeterReadingState> {
  const session = await requireCaretakerAccess();

  const unitId = String(formData.get("unitId") ?? "").trim();
  const period = String(formData.get("period") ?? "").trim();
  const notes = formData.get("notes");
  const photo = formData.get("photo");
  const currentReading = parseInteger(formData.get("currentReading"));

  const fieldErrors: QuickMeterReadingState["fieldErrors"] = {};

  if (!unitId) {
    fieldErrors.unitId = "Choose a house.";
  }

  if (!period) {
    return {
      error: "Missing billing period.",
      submittedUnitIds: prevState.submittedUnitIds,
    };
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
    fieldErrors.unitId ||
    fieldErrors.currentReading ||
    fieldErrors.photo ||
    fieldErrors.notes
  ) {
    return {
      error: "Please fix the highlighted fields.",
      submittedUnitIds: prevState.submittedUnitIds,
      fieldErrors,
    };
  }

  if (currentReading! < 0) {
    return {
      error: "Current reading cannot be negative.",
      submittedUnitIds: prevState.submittedUnitIds,
      fieldErrors: {
        currentReading: "Current reading cannot be negative.",
      },
    };
  }

  const allowedUnitIds = await getCaretakerManagedBuildingUnitIds({
    orgId: session.activeOrgId!,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
  });

  const unit = await prisma.unit.findFirst({
    where: {
      id: unitId,
      isActive: true,
      status: "OCCUPIED",
      leases: {
        some: {
          status: "ACTIVE",
        },
      },
    },
    select: {
      id: true,
      houseNo: true,
      property: {
        select: {
          name: true,
          orgId: true,
          waterRatePerUnit: true,
          waterFixedCharge: true,
        },
      },
      leases: {
        where: {
          status: "ACTIVE",
        },
        take: 1,
        select: {
          id: true,
          tenantId: true,
        },
      },
    },
  });

  if (!unit || !allowedUnitIds.includes(unit.id)) {
    return {
      error: "No occupied assigned house matches that selection.",
      submittedUnitIds: prevState.submittedUnitIds,
      fieldErrors: {
        unitId: "Choose an assigned occupied house.",
      },
    };
  }

  const activeLease = unit.leases[0];

  if (!activeLease) {
    return {
      error: "This house has no active lease, so a tenant bill cannot be prepared.",
      submittedUnitIds: prevState.submittedUnitIds,
      fieldErrors: {
        unitId: "Choose a house with an active tenant.",
      },
    };
  }

  const existingReading = await prisma.meterReading.findUnique({
    where: {
      unitId_period: {
        unitId: unit.id,
        period,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingReading) {
    return {
      error: "A meter reading has already been submitted for this house and period.",
      submittedUnitIds: prevState.submittedUnitIds,
      fieldErrors: {
        unitId: "This house is already submitted.",
      },
    };
  }

  const previousReading = await prisma.meterReading.findFirst({
    where: {
      unitId: unit.id,
      period: {
        lt: period,
      },
    },
    orderBy: [{ period: "desc" }, { createdAt: "desc" }],
    select: {
      currentReading: true,
    },
  });
  const prevReading = previousReading?.currentReading ?? 0;

  if (currentReading! < prevReading) {
    return {
      error: "Current reading cannot be less than the previous reading.",
      submittedUnitIds: prevState.submittedUnitIds,
      previousReading: prevReading,
      fieldErrors: {
        currentReading: `Current reading must be at least ${prevReading}.`,
      },
    };
  }

  const unitsUsed = currentReading! - prevReading;
  const submittedByUserId =
    (session as { userId?: string; id?: string }).userId ??
    (session as { userId?: string; id?: string }).id;

  if (!submittedByUserId) {
    return {
      error: "Could not determine the signed-in caretaker.",
      submittedUnitIds: prevState.submittedUnitIds,
    };
  }

  const ratePerUnit = Number(unit.property.waterRatePerUnit ?? 0);
  const fixedCharge = Number(unit.property.waterFixedCharge ?? 0);
  const total = unitsUsed * ratePerUnit + fixedCharge;
  const dueDate = addDays(new Date(), 7);
  let photoAssetId: string | undefined;

  if (photo instanceof File && photo.size > 0) {
    photoAssetId = await uploadMeterPhoto({
      photo,
      unitId: unit.id,
      period,
      orgId: unit.property.orgId,
      submittedByUserId,
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.meterReading.create({
      data: {
        unitId: unit.id,
        period,
        prevReading,
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

    await tx.waterBill.upsert({
      where: {
        unitId_period: {
          unitId: unit.id,
          period,
        },
      },
      update: {
        tenantId: activeLease.tenantId,
        unitsUsed,
        ratePerUnit,
        fixedCharge,
        total,
        dueDate,
        status: "PENDING_APPROVAL",
        notes: `Draft generated from submitted meter reading for ${unit.property.name} / Unit ${unit.houseNo}. Awaiting organization verification approval.`,
      },
      create: {
        orgId: unit.property.orgId,
        unitId: unit.id,
        tenantId: activeLease.tenantId,
        period,
        unitsUsed,
        ratePerUnit,
        fixedCharge,
        total,
        dueDate,
        status: "PENDING_APPROVAL",
        notes: `Draft generated from submitted meter reading for ${unit.property.name} / Unit ${unit.houseNo}. Awaiting organization verification approval.`,
      },
    });
  });

  await notifyOrgReviewers({
    orgId: unit.property.orgId,
    houseNo: unit.houseNo,
    propertyName: unit.property.name,
    period,
  });

  revalidatePath("/dashboard/caretaker/water-bills");
  revalidatePath("/dashboard/caretaker/water-bills/read");
  revalidatePath("/dashboard/org/notifications");

  const submittedUnitIds = prevState.submittedUnitIds?.includes(unit.id)
    ? prevState.submittedUnitIds
    : [...(prevState.submittedUnitIds ?? []), unit.id];

  return {
    success: `House ${unit.houseNo} submitted for verification approval.`,
    submittedUnitIds,
    submittedUnitId: unit.id,
    submittedHouseNo: unit.houseNo,
    previousReading: prevReading,
    unitsUsed,
  };
}