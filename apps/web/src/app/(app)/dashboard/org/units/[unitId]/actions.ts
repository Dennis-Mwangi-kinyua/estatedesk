"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { AssetType, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { revalidatePublicVacancies } from "@/lib/public-vacancy-cache";
import { ensureUnitPublicSlug } from "@/lib/public-vacancy-ensure-slug";
import { prisma } from "@/lib/prisma";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { storage } from "@/lib/storage";
import { validateImageFile, type ValidatedImage } from "@/lib/uploads/secure-image";

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

function successRedirect(unitId: string, message: string): never {
  redirect(
    `/dashboard/org/units/${unitId}?message=${encodeURIComponent(message)}&messageType=success`,
  );
}

function isS3Configured() {
  return Boolean(
    process.env.S3_BUCKET &&
      process.env.S3_REGION &&
      ((process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) ||
        process.env.AWS_ACCESS_KEY_ID),
  );
}

async function storeVacancyImage(input: {
  orgId: string;
  unitId: string;
  image: ValidatedImage;
}) {
  const fileName = `${input.unitId}-${randomUUID()}${input.image.extension}`;

  if (isS3Configured()) {
    const key = `vacancies/${input.orgId}/${fileName}`;
    const uploaded = await storage.uploadFile({
      key,
      body: input.image.buffer,
      contentType: input.image.mimeType,
    });

    return {
      key: uploaded.key,
      publicUrl: uploaded.url,
      storage: "s3" as const,
    };
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "vacancies");
  await mkdir(uploadDir, { recursive: true });
  const publicKey = `/uploads/vacancies/${fileName}`;
  await writeFile(path.join(uploadDir, fileName), input.image.buffer);

  return {
    key: publicKey,
    publicUrl: publicKey,
    storage: "local" as const,
  };
}

async function loadManagedUnit(unitId: string, orgId: string) {
  return prisma.unit.findFirst({
    where: {
      id: unitId,
      deletedAt: null,
      property: {
        orgId,
        deletedAt: null,
      },
    },
    select: {
      id: true,
      houseNo: true,
      publicSlug: true,
      propertyId: true,
      property: { select: { name: true } },
      images: {
        where: { deletedAt: null },
        select: { id: true, key: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function updateUnitVacancyMarketingAction(
  unitId: string,
  formData: FormData,
) {
  const session = await requireManagementAccess();

  const unit = await loadManagedUnit(unitId, session.activeOrgId!);

  if (!unit) {
    uploadError(unitId, "Unit not found.");
  }

  const isPubliclyListed = formData.get("isPubliclyListed") === "on";

  const updated = await prisma.unit.update({
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
      isPubliclyListed,
    },
    select: {
      id: true,
      houseNo: true,
      publicSlug: true,
      property: { select: { name: true } },
    },
  });

  const publicSlug = isPubliclyListed
    ? await ensureUnitPublicSlug({
        id: updated.id,
        houseNo: updated.houseNo,
        publicSlug: updated.publicSlug,
        property: updated.property,
      })
    : updated.publicSlug;

  revalidatePath(`/dashboard/org/units/${unitId}`);
  revalidatePublicVacancies({
    unitId: updated.id,
    propertyName: updated.property.name,
    houseNo: updated.houseNo,
    publicSlug,
  });
}

export async function uploadUnitVacancyImagesAction(
  unitId: string,
  formData: FormData,
) {
  const session = await requireManagementAccess();

  const unit = await loadManagedUnit(unitId, session.activeOrgId!);

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

  for (const file of files) {
    let image: ValidatedImage;
    try {
      image = await validateImageFile(file, { maxBytes: 5 * 1024 * 1024 });
    } catch (error) {
      uploadError(unitId, error instanceof Error ? error.message : "Invalid image file.");
    }
    const stored = await storeVacancyImage({
      orgId: session.activeOrgId!,
      unitId: unit.id,
      image,
    });

    await prisma.asset.create({
      data: {
        orgId: session.activeOrgId!,
        unitId: unit.id,
        fileName: file.name,
        fileType: "image",
        mimeType: image.mimeType,
        key: stored.key,
        size: image.size,
        assetType: AssetType.PHOTO,
        uploadedByUserId: session.userId,
        metadata: {
          publicUrl: stored.publicUrl,
          purpose: "vacancy_gallery",
          storage: stored.storage,
        },
      },
    });
  }

  const publicSlug = await ensureUnitPublicSlug({
    id: unit.id,
    houseNo: unit.houseNo,
    publicSlug: unit.publicSlug,
    property: unit.property,
  });

  revalidatePath(`/dashboard/org/units/${unitId}`);
  revalidatePublicVacancies({
    unitId: unit.id,
    propertyName: unit.property.name,
    houseNo: unit.houseNo,
    publicSlug,
  });
}

export async function deleteUnitVacancyImageAction(
  unitId: string,
  formData: FormData,
) {
  const session = await requireManagementAccess();
  const assetId = optionalString(formData.get("assetId"));

  if (!assetId) {
    uploadError(unitId, "Image not found.");
  }

  const unit = await loadManagedUnit(unitId, session.activeOrgId!);
  if (!unit) {
    uploadError(unitId, "Unit not found.");
  }

  const asset = await prisma.asset.findFirst({
    where: {
      id: assetId,
      unitId: unit.id,
      orgId: session.activeOrgId!,
      deletedAt: null,
    },
    select: { id: true, key: true },
  });

  if (!asset) {
    uploadError(unitId, "Image not found.");
  }

  await prisma.asset.update({
    where: { id: asset.id },
    data: { deletedAt: new Date() },
  });

  // Best-effort storage cleanup for S3 keys (skip local /public paths).
  if (asset.key && !asset.key.startsWith("/") && isS3Configured()) {
    try {
      await storage.deleteFile(asset.key);
    } catch (error) {
      console.warn("[vacancy-image] S3 delete failed", error);
    }
  }

  const publicSlug = await ensureUnitPublicSlug({
    id: unit.id,
    houseNo: unit.houseNo,
    publicSlug: unit.publicSlug,
    property: unit.property,
  });

  revalidatePath(`/dashboard/org/units/${unitId}`);
  revalidatePublicVacancies({
    unitId: unit.id,
    propertyName: unit.property.name,
    houseNo: unit.houseNo,
    publicSlug,
  });
  successRedirect(unitId, "Image removed.");
}

export async function setPrimaryUnitVacancyImageAction(
  unitId: string,
  formData: FormData,
) {
  const session = await requireManagementAccess();
  const assetId = optionalString(formData.get("assetId"));

  if (!assetId) {
    uploadError(unitId, "Image not found.");
  }

  const unit = await loadManagedUnit(unitId, session.activeOrgId!);
  if (!unit) {
    uploadError(unitId, "Unit not found.");
  }

  const asset = unit.images.find((image) => image.id === assetId);
  if (!asset) {
    uploadError(unitId, "Image not found.");
  }

  // Move selected image to front by bumping createdAt of others after it.
  const now = Date.now();
  await prisma.$transaction(async (tx) => {
    await tx.asset.update({
      where: { id: asset.id },
      data: { createdAt: new Date(now - unit.images.length * 1000) },
    });

    let offset = 1;
    for (const image of unit.images) {
      if (image.id === asset.id) continue;
      await tx.asset.update({
        where: { id: image.id },
        data: { createdAt: new Date(now - (unit.images.length - offset) * 1000) },
      });
      offset += 1;
    }
  });

  const publicSlug = await ensureUnitPublicSlug({
    id: unit.id,
    houseNo: unit.houseNo,
    publicSlug: unit.publicSlug,
    property: unit.property,
  });

  revalidatePath(`/dashboard/org/units/${unitId}`);
  revalidatePublicVacancies({
    unitId: unit.id,
    propertyName: unit.property.name,
    houseNo: unit.houseNo,
    publicSlug,
  });
  successRedirect(unitId, "Primary photo updated.");
}
