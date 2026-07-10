import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { AssetType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function publicAssetUrl(key: string) {
  if (key.startsWith("/") || key.startsWith("http")) return key;
  return `/${key.replace(/^public\//, "")}`;
}

export async function uploadInspectionPhoto({
  photo,
  inspectionId,
  roomKey,
  unitId,
  orgId,
  submittedByUserId,
}: {
  photo: File;
  inspectionId: string;
  roomKey: string;
  unitId?: string;
  orgId: string;
  submittedByUserId: string;
}) {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "inspections");
  await mkdir(uploadDir, { recursive: true });

  const ext = path.extname(photo.name).toLowerCase() || ".jpg";
  const fileName = `${inspectionId}-${roomKey}-${randomUUID()}${ext}`;
  const publicKey = `/uploads/inspections/${fileName}`;
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
        purpose: "inspection_room_photo",
        inspectionId,
        roomKey,
      },
    },
    select: {
      id: true,
    },
  });

  return asset.id;
}