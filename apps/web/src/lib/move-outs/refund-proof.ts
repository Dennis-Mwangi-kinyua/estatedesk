import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { Asset } from "@prisma/client";
import { getStorageConfig } from "@/lib/config/env";
import { prisma } from "@/lib/prisma";
import { validateImageBytes } from "@/lib/uploads/secure-image";
import { uploadPrivateCloudflareImage, readPrivateCloudflareImage } from "@/lib/uploads/cloudflare-images";

function privateStore() {
  const bucket = process.env.PAYMENT_PROOF_BUCKET?.trim();
  if (!bucket) {
    if (process.env.NODE_ENV === "production") throw new Error("Configure Cloudflare Images or a private PAYMENT_PROOF_BUCKET before recording refunds.");
    return { directory: process.env.PRIVATE_PROOF_DIR?.trim() || path.join(process.cwd(), ".private", "payment-proof") };
  }
  const config = getStorageConfig();
  return { bucket, client: new S3Client({ region: config.region, endpoint: config.endpoint, forcePathStyle: Boolean(config.endpoint), credentials: config.credentials }) };
}

export async function saveRefundProof(file: File, input: { noticeId: string; orgId: string; unitId: string; actorUserId: string }) {
  if (file.size <= 0 || file.size > 2 * 1024 * 1024) throw new Error("Attach an image under 2MB.");
  const image = validateImageBytes(Buffer.from(await file.arrayBuffer()), { maxBytes: 2 * 1024 * 1024 });
  const cloudflare = await uploadPrivateCloudflareImage(image, file.name);
  if (cloudflare) {
    const asset = await prisma.asset.create({ data: { orgId: input.orgId, unitId: input.unitId, uploadedByUserId: input.actorUserId, fileName: file.name, fileType: "image", mimeType: image.mimeType, size: image.size, assetType: "PHOTO", key: `/api/move-outs/${input.noticeId}/refund-proof`, metadata: { purpose: "move_out_refund_proof", noticeId: input.noticeId, imageId: cloudflare.imageId, storage: cloudflare.storage } } });
    return asset.id;
  }
  const objectKey = `${input.orgId}/${randomUUID()}${image.extension}`;
  const store = privateStore();
  if (store.client) await store.client.send(new PutObjectCommand({ Bucket: store.bucket, Key: objectKey, Body: image.buffer, ContentType: image.mimeType }));
  else { await mkdir(path.join(store.directory!, input.orgId), { recursive: true }); await writeFile(path.join(store.directory!, objectKey), image.buffer, { mode: 0o600 }); }
  const asset = await prisma.asset.create({ data: { orgId: input.orgId, unitId: input.unitId, uploadedByUserId: input.actorUserId, fileName: file.name, fileType: "image", mimeType: image.mimeType, size: image.size, assetType: "PHOTO", key: `/api/move-outs/${input.noticeId}/refund-proof`, metadata: { purpose: "move_out_refund_proof", noticeId: input.noticeId, objectKey, storage: store.client ? "s3-private" : "local-private" } } });
  return asset.id;
}

export async function readRefundProof(asset: Asset) {
  const metadata = asset.metadata;
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata) && metadata.purpose === "move_out_refund_proof" && metadata.storage === "cloudflare-private" && typeof metadata.imageId === "string") {
    return readPrivateCloudflareImage(metadata.imageId);
  }
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata) || typeof metadata.objectKey !== "string" || metadata.purpose !== "move_out_refund_proof") throw new Error("Refund proof is unavailable.");
  const objectKey = metadata.objectKey;
  if (!objectKey.startsWith(`${asset.orgId}/`) || objectKey.includes("..") || !/^[a-zA-Z0-9/_-]+\.(png|jpg|webp)$/.test(objectKey)) throw new Error("Invalid proof key.");
  const store = privateStore();
  if (metadata.storage === "s3-private" && store.client) {
    const result = await store.client.send(new GetObjectCommand({ Bucket: store.bucket, Key: objectKey }));
    if (!result.Body) throw new Error("Proof is empty.");
    return Buffer.from(await result.Body.transformToByteArray());
  }
  if (metadata.storage === "local-private" && store.directory) return readFile(path.join(store.directory, objectKey));
  throw new Error("Refund proof storage is not configured.");
}
