"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { AssetType, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireManagementAccess } from "@/lib/permissions/guards";

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalDecimal(value: FormDataEntryValue | null) {
  const raw = optionalString(value);
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return new Prisma.Decimal(raw);
}

function optionalInteger(value: FormDataEntryValue | null) {
  const raw = optionalString(value);
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function uploadError(unitId: string, message: string): never {
  redirect(
    `/dashboard/org/units/${unitId}?message=${encodeURIComponent(
      message,
    )}&messageType=error`,
  );
}

function publicAssetUrl(key: string) {
  if (key.startsWith("/") || key.startsWith("http")) return key;
  return `/${key.replace(/^public\//, "")}`;
}

export async function updateUnitVacancyMarketingAction(
  unitId: string,
  formData: FormData,
) {
  const session = await requireManagementAccess();

  const unit = await prisma.unit.findFirst({
    where: {
      id: unitId,
      deletedAt: null,
      property: {
        orgId: session.activeOrgId!,
        deletedAt: null,
      },
    },
    select: { id: true },
  });

  if (!unit) {
    uploadError(unitId, "Unit not found.");
  }

  await prisma.unit.update({
    where: { id: unit.id },
    data: {
      roomCount: optionalInteger(formData.get("roomCount")),
      bedrooms: optionalInteger(formData.get("bedrooms")),
      bathrooms: optionalInteger(formData.get("bathrooms")),
      hasBalcony: formData.get("hasBalcony") === "on",
      serviceCharge: optionalDecimal(formData.get("serviceCharge")),
      garbageFee: optionalDecimal(formData.get("garbageFee")),
      securityFee: optionalDecimal(formData.get("securityFee")),
      electricityBilling: optionalString(formData.get("electricityBilling")),
      viewingFeeRequired: formData.get("viewingFeeRequired") === "on",
      viewingFeeAmount: optionalDecimal(formData.get("viewingFeeAmount")),
      notes: optionalString(formData.get("notes")),
    },
  });

  revalidatePath(`/dashboard/org/units/${unitId}`);
  revalidatePath(`/vacancies/${unitId}`);
  revalidatePath("/vacancies");
}

export async function uploadUnitVacancyImagesAction(
  unitId: string,
  formData: FormData,
) {
  const session = await requireManagementAccess();

  const unit = await prisma.unit.findFirst({
    where: {
      id: unitId,
      deletedAt: null,
      property: {
        orgId: session.activeOrgId!,
        deletedAt: null,
      },
    },
    select: {
      id: true,
      propertyId: true,
      images: {
        where: { deletedAt: null },
        select: { id: true },
      },
    },
  });

  if (!unit) {
    uploadError(unitId, "Unit not found.");
  }

  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0)
    .slice(0, 8);

  if (files.length === 0) {
    uploadError(unitId, "Choose at least one image.");
  }

  if (unit.images.length + files.length > 12) {
    uploadError(unitId, "Each unit can have up to 12 vacancy images.");
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "vacancies");
  await mkdir(uploadDir, { recursive: true });

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      uploadError(unitId, "Only image files are allowed.");
    }

    if (file.size > 5 * 1024 * 1024) {
      uploadError(unitId, "Each image must be 5MB or smaller.");
    }

    const ext = path.extname(file.name).toLowerCase() || ".jpg";
    const fileName = `${unit.id}-${randomUUID()}${ext}`;
    const publicKey = `/uploads/vacancies/${fileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(path.join(uploadDir, fileName), buffer);

    await prisma.asset.create({
      data: {
        orgId: session.activeOrgId!,
        unitId: unit.id,
        fileName: file.name,
        fileType: "image",
        mimeType: file.type,
        key: publicKey,
        size: file.size,
        assetType: AssetType.PHOTO,
        uploadedByUserId: session.userId,
        metadata: {
          publicUrl: publicAssetUrl(publicKey),
          purpose: "vacancy_gallery",
        },
      },
    });
  }

  revalidatePath(`/dashboard/org/units/${unitId}`);
  revalidatePath(`/vacancies/${unitId}`);
  revalidatePath("/vacancies");
}
