import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { Asset, Prisma } from "@prisma/client";
import { getStorageConfig } from "@/lib/config/env";
import { validateImageBytes, type ValidatedImage } from "@/lib/uploads/secure-image";
import { uploadPrivateCloudflareImage, readPrivateCloudflareImage } from "@/lib/uploads/cloudflare-images";

function privateStore() {
  const bucket = process.env.PAYMENT_PROOF_BUCKET?.trim();
  if (!bucket) {
    if (process.env.NODE_ENV === "production") throw new Error("Configure Cloudflare Images or a private PAYMENT_PROOF_BUCKET before uploading payment proof.");
    return { directory: path.join(process.cwd(), ".private", "payment-proof") };
  }
  const config = getStorageConfig();
  return { bucket, client: new S3Client({ region: config.region, endpoint: config.endpoint, forcePathStyle: Boolean(config.endpoint), credentials: config.credentials }) };
}

export async function storePaymentProof(image: ValidatedImage, fileName: string, orgId: string): Promise<Prisma.InputJsonObject> {
  const uploaded = await uploadPrivateCloudflareImage(image, fileName);
  if (uploaded) return { purpose: "payment_proof", imageId: uploaded.imageId, storage: uploaded.storage };
  const objectKey = `${orgId}/${randomUUID()}${image.extension}`;
  const store = privateStore();
  if (store.client) await store.client.send(new PutObjectCommand({ Bucket: store.bucket, Key: objectKey, Body: image.buffer, ContentType: image.mimeType }));
  else {
    await mkdir(path.join(store.directory!, orgId), { recursive: true, mode: 0o700 });
    await writeFile(path.join(store.directory!, objectKey), image.buffer, { mode: 0o600 });
  }
  return { purpose: "payment_proof", objectKey, storage: store.client ? "s3-private" : "local-private" };
}

export async function createPaymentProofAsset(db: Pick<Prisma.TransactionClient, "asset">, input: { image: ValidatedImage; fileName: string; orgId: string; userId: string; paymentId: string; unitId?: string }) {
  const metadata = await storePaymentProof(input.image, input.fileName, input.orgId);
  return db.asset.create({ data: {
    orgId: input.orgId, unitId: input.unitId, uploadedByUserId: input.userId,
    fileName: input.fileName, fileType: "image", mimeType: input.image.mimeType,
    size: input.image.size, assetType: "PHOTO", key: `/api/payments/${input.paymentId}/proof`,
    metadata: { ...metadata, paymentId: input.paymentId },
  } });
}

export async function readPaymentProof(asset: Asset) {
  const metadata = asset.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata) || metadata.purpose !== "payment_proof") throw new Error("Payment proof is unavailable.");
  if (metadata.storage === "cloudflare-private" && typeof metadata.imageId === "string") return readPrivateCloudflareImage(metadata.imageId);
  const key = metadata.objectKey;
  if (typeof key !== "string" || !key.startsWith(`${asset.orgId}/`) || key.includes("..") || !/^[a-zA-Z0-9/_-]+\.(png|jpg|webp)$/.test(key)) throw new Error("Invalid proof key.");
  const store = privateStore();
  if (metadata.storage === "s3-private" && store.client) {
    const result = await store.client.send(new GetObjectCommand({ Bucket: store.bucket, Key: key }));
    if (!result.Body) throw new Error("Payment proof is empty.");
    return Buffer.from(await result.Body.transformToByteArray());
  }
  if (metadata.storage === "local-private" && store.directory) return readFile(path.join(store.directory, key));
  throw new Error("Payment proof storage is unavailable.");
}

export async function validatedPaymentProof(asset: Asset) {
  return validateImageBytes(await readPaymentProof(asset), { maxBytes: 5 * 1024 * 1024 });
}
