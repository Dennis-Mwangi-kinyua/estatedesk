import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { AssetType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ImageUploadPayload = {
  base64: string;
  fileName: string;
  mimeType: string;
  size: number;
};

function publicAssetUrl(key: string) {
  if (key.startsWith("/") || key.startsWith("http")) return key;
  return `/${key.replace(/^public\//, "")}`;
}

export async function saveImagePayloadAsset({
  payload,
  uploadDir,
  filePrefix,
  orgId,
  unitId,
  submittedByUserId,
  purpose,
  metadata = {},
}: {
  payload: ImageUploadPayload;
  uploadDir: string;
  filePrefix: string;
  orgId: string;
  unitId?: string;
  submittedByUserId: string;
  purpose: string;
  metadata?: Record<string, string | undefined>;
}) {
  const ext = path.extname(payload.fileName).toLowerCase() || ".jpg";
  const fileName = `${filePrefix}-${randomUUID()}${ext}`;
  const publicKey = `/uploads/${uploadDir}/${fileName}`;
  const absoluteDir = path.join(process.cwd(), "public", "uploads", uploadDir);

  await mkdir(absoluteDir, { recursive: true });
  await writeFile(
    path.join(absoluteDir, fileName),
    Buffer.from(payload.base64, "base64"),
  );

  const asset = await prisma.asset.create({
    data: {
      orgId,
      unitId,
      fileName: payload.fileName,
      fileType: "image",
      mimeType: payload.mimeType,
      key: publicKey,
      size: payload.size,
      assetType: AssetType.PHOTO,
      uploadedByUserId: submittedByUserId,
      metadata: {
        publicUrl: publicAssetUrl(publicKey),
        purpose,
        ...metadata,
      },
    },
    select: {
      id: true,
    },
  });

  return asset.id;
}