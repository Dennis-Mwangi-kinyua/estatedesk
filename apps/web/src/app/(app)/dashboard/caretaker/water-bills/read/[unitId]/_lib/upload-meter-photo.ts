import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { AssetType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { publicAssetUrl } from "./helpers";
import { validateImageFile } from "@/lib/uploads/secure-image";

export async function uploadMeterPhoto({
  photo,
  unitId,
  period,
  orgId,
  submittedByUserId,
}: {
  photo: File;
  unitId: string;
  period: string;
  orgId: string;
  submittedByUserId: string;
}) {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "meters");
  await mkdir(uploadDir, { recursive: true });

  const image = await validateImageFile(photo, { maxBytes: 5 * 1024 * 1024 });
  const fileName = `${unitId}-${period}-${randomUUID()}${image.extension}`;
  const publicKey = `/uploads/meters/${fileName}`;
  await writeFile(path.join(uploadDir, fileName), image.buffer);

  const asset = await prisma.asset.create({
    data: {
      orgId,
      unitId,
      fileName: photo.name,
      fileType: "image",
      mimeType: image.mimeType,
      key: publicKey,
      size: image.size,
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

  return asset.id;
}
