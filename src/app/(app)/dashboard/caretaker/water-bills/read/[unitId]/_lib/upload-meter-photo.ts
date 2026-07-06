import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { AssetType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { publicAssetUrl } from "./helpers";

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

  const ext = path.extname(photo.name).toLowerCase() || ".jpg";
  const fileName = `${unitId}-${period}-${randomUUID()}${ext}`;
  const publicKey = `/uploads/meters/${fileName}`;
  const buffer = Buffer.from(await photo.arrayBuffer());

  await writeFile(path.join(uploadDir, fileName), buffer);

  const asset = await prisma.asset.create({
    data: {
      orgId,
      unitId,
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

  return asset.id;
}