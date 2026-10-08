import "server-only";
import { uploadCloudflareImage } from "@/lib/uploads/cloudflare-images";
import { validateImageBytes } from "@/lib/uploads/secure-image";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { AssetType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { receiptPublicUrl } from "./receipt-public-url";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadFinanceRequestReceipt({
  receipt,
  orgId,
  uploadedByUserId,
  requestNumber,
}: {
  receipt: File;
  orgId: string;
  uploadedByUserId: string;
  requestNumber: string;
}) {
  if (!ALLOWED_MIME_TYPES.has(receipt.type)) {
    throw new Error("Receipt must be a JPG, PNG, WebP, or PDF file.");
  }

  if (receipt.size > MAX_BYTES) {
    throw new Error("Receipt must be 5MB or smaller.");
  }

  const buffer = Buffer.from(await receipt.arrayBuffer());
  const image = receipt.type.startsWith("image/")
    ? validateImageBytes(buffer, { maxBytes: MAX_BYTES })
    : null;
  if (!image && !buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
    throw new Error("Receipt must be a genuine image or PDF file.");
  }
  const ext = image?.extension ?? ".pdf";
  const fileName = `${requestNumber.replace(/[^a-zA-Z0-9-]/g, "-")}-${randomUUID()}${ext}`;
  const uploaded = image ? await uploadCloudflareImage(image, fileName) : null;
  const publicKey = uploaded?.key ?? `/uploads/finance-requests/${fileName}`;
  if (!uploaded) {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "finance-requests");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);
  }

  await prisma.asset.create({
    data: {
      orgId,
      fileName: receipt.name,
      fileType: receipt.type.startsWith("image/") ? "image" : "document",
      mimeType: image?.mimeType ?? "application/pdf",
      key: publicKey,
      size: receipt.size,
      assetType: AssetType.DOCUMENT,
      uploadedByUserId,
      metadata: {
        publicUrl: receiptPublicUrl(publicKey),
        purpose: "finance_request_receipt",
        requestNumber,
      },
    },
  });

  return publicKey;
}