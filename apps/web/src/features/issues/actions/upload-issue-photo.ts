import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { AssetType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validateImageFile } from "@/lib/uploads/secure-image";

function publicAssetUrl(key: string) {
  if (key.startsWith("/") || key.startsWith("http")) return key;
  return `/${key.replace(/^public\//, "")}`;
}

export async function uploadIssuePhoto({
  photo,
  unitId,
  orgId,
  submittedByUserId,
}: {
  photo: File;
  unitId?: string;
  orgId: string;
  submittedByUserId: string;
}) {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "issues");
  await mkdir(uploadDir, { recursive: true });

  const image = await validateImageFile(photo, { maxBytes: 5 * 1024 * 1024 });
  const fileName = `${unitId ?? "general"}-${randomUUID()}${image.extension}`;
  const publicKey = `/uploads/issues/${fileName}`;
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
        purpose: "issue_evidence",
      },
    },
    select: {
      id: true,
    },
  });

  return asset.id;
}
