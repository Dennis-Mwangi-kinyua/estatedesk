"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { AssetType } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCaretakerManagedBuildingUnitIds } from "@/lib/caretaker/access";
import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { encodePublicId } from "@/lib/public-id";
import { notifyInAppAndPush } from "@/lib/notifications/notify";

export type SubmitMeterReadingState = {
  error?: string;
  success?: string;
  fieldErrors?: {
    prevReading?: string;
    currentReading?: string;
    notes?: string;
  };
};

export type QuickMeterReadingState = {
  error?: string;
  success?: string;
  submittedUnitIds?: string[];
  submittedUnitId?: string;
  submittedHouseNo?: string;
  previousReading?: number;
  unitsUsed?: number;
  fieldErrors?: {
    unitId?: string;
    currentReading?: string;
    photo?: string;
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

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function publicAssetUrl(key: string) {
  if (key.startsWith("/") || key.startsWith("http")) return key;
  return `/${key.replace(/^public\//, "")}`;
}

async function notifyOrgReviewers({
  orgId,
  houseNo,
  propertyName,
  period,
}: {
  orgId: string;
  houseNo: string;
  propertyName: string;
  period: string;
}) {
  const reviewers = await prisma.membership.findMany({
    where: {
      orgId,
      role: {
        in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
      },
      user: {
        deletedAt: null,
      },
    },
    select: {
      userId: true,
    },
  });

  if (reviewers.length === 0) return;

  await notifyInAppAndPush({
    db: prisma,
    orgId,
    recipients: reviewers.map(({ userId }) => ({ userId })),
    type: "GENERAL",
    title: "Meter reading submitted",
    message: `House ${houseNo} at ${propertyName} has a ${period} water reading waiting for verification approval.`,
  });
}

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
    const uploadDir = path.join(process.cwd(), "public", "uploads", "meters");
    await mkdir(uploadDir, { recursive: true });

    const ext = path.extname(photo.name).toLowerCase() || ".jpg";
    const fileName = `${unit.id}-${period}-${randomUUID()}${ext}`;
    const publicKey = `/uploads/meters/${fileName}`;
    const buffer = Buffer.from(await photo.arrayBuffer());

    await writeFile(path.join(uploadDir, fileName), buffer);

    const asset = await prisma.asset.create({
      data: {
        orgId: unit.property.orgId,
        unitId: unit.id,
        fileName: photo.name,
        fileType: "image",
        mimeType: photo.type,
        key: publicKey,
        size: photo.size,
        assetType: AssetType.PHOTO,
        uploadedByUserId: submittedByUserId,
        metadata: {
          publicUrl: publicAssetUrl(publicKey),
          purpose: "meter_reading_evidence",
          period,
        },
      },
      select: {
        id: true,
      },
    });

    photoAssetId = asset.id;
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

  const allowedUnitIds = await getCaretakerManagedBuildingUnitIds({
    orgId: session.activeOrgId!,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
  });

  if (!allowedUnitIds.includes(unitId)) {
    return {
      error: "You can only submit water readings for units under apartments you manage.",
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

  redirect(
    `/dashboard/caretaker/water-bills/readings/${encodePublicId(
      reading.id,
      "meter-reading",
    )}`,
  );
}
