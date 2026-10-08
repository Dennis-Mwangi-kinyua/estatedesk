import { uploadCloudflareImage } from "@/lib/uploads/cloudflare-images";
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

export async function uploadCompletionPhoto({
  photo,
  issueId,
  reportId,
  unitId,
  orgId,
  submittedByUserId,
}: {
  photo: File;
  issueId: string;
  reportId: string;
  unitId?: string;
  orgId: string;
  submittedByUserId: string;
}) {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "issues");

  const image = await validateImageFile(photo, { maxBytes: 5 * 1024 * 1024 });
  const fileName = `completion-${issueId}-${randomUUID()}${image.extension}`;
  const uploaded = await uploadCloudflareImage(image, fileName);
  const publicKey = uploaded?.key ?? `/uploads/issues/${fileName}`;
  if (!uploaded) {
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), image.buffer);
  }

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
        purpose: "issue_completion_evidence",
        issueId,
        issueResolutionReportId: reportId,
      },
    },
    select: {
      id: true,
    },
  });

  return asset.id;
}
