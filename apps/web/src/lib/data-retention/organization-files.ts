import "server-only";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { Asset, PrismaClient } from "@prisma/client";
import { getStorageConfig } from "@/lib/config/env";
import { storage } from "@/lib/storage/s3";
import { deleteCloudflareImage, deletePrivateCloudflareImage } from "@/lib/uploads/cloudflare-images";
import { organizationPurgeWhere } from "./organization-deletion";

async function removeLocal(root: string, key: string) {
  const resolvedRoot = path.resolve(root);
  const target = path.resolve(resolvedRoot, key);
  if (!target.startsWith(`${resolvedRoot}${path.sep}`)) throw new Error("File is outside its storage directory.");
  await unlink(target).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
}

async function removeAsset(asset: Asset) {
  const metadata = asset.metadata && typeof asset.metadata === "object" && !Array.isArray(asset.metadata) ? asset.metadata : {};
  if (metadata.storage === "cloudflare-private" && typeof metadata.imageId === "string") {
    await deletePrivateCloudflareImage(metadata.imageId);
  } else if (["s3-private", "local-private"].includes(String(metadata.storage))) {
    const key = metadata.objectKey;
    if (typeof key !== "string" || !key.startsWith(`${asset.orgId}/`) || key.includes("..")) throw new Error("Private file ownership is invalid.");
    if (metadata.storage === "local-private") {
      const root = metadata.purpose === "move_out_refund_proof" && process.env.PRIVATE_PROOF_DIR?.trim()
        || path.join(process.cwd(), ".private", "payment-proof");
      await removeLocal(root, key);
    } else {
      const config = getStorageConfig();
      if (!process.env.PAYMENT_PROOF_BUCKET) throw new Error("Private proof bucket is unavailable.");
      const client = new S3Client({ region: config.region, endpoint: config.endpoint, forcePathStyle: Boolean(config.endpoint), credentials: config.credentials });
      try {
        await client.send(new DeleteObjectCommand({ Bucket: process.env.PAYMENT_PROOF_BUCKET, Key: key }), { abortSignal: AbortSignal.timeout(10000) });
      } finally { client.destroy(); }
    }
  } else if (await deleteCloudflareImage(asset.key)) {
    return;
  } else if (asset.key.startsWith("/uploads/")) {
    await removeLocal(path.join(process.cwd(), "public", "uploads"), asset.key.slice("/uploads/".length));
  } else if (!asset.key.startsWith("/") && !/^https?:/i.test(asset.key)) {
    await storage.deleteFile(asset.key);
  } else {
    // Unknown storage must be investigated before its only database reference is removed.
    throw new Error("Unknown organization asset storage.");
  }
}

/** Small resumable batches retain references until every file has been removed. */
export async function cleanOrganizationFiles(db: PrismaClient, orgId: string, now = new Date()) {
  if (!await db.organization.findFirst({ where: { id: orgId, ...organizationPurgeWhere(now) }, select: { id: true } })) return false;
  const assets = await db.asset.findMany({ where: { orgId }, orderBy: { id: "asc" } });
  const deadline = Date.now() + 20000;
  let removed = 0;
  for (const asset of assets) {
    const metadata = asset.metadata && typeof asset.metadata === "object" && !Array.isArray(asset.metadata) ? asset.metadata : {};
    if (metadata.retentionFileRemovedAt) continue;
    if (removed === 20 || Date.now() >= deadline) return false;
    const shared = await db.asset.findFirst({ where: { orgId: { not: orgId }, key: asset.key }, select: { id: true } });
    if (!shared) await removeAsset(asset);
    await db.asset.update({ where: { id: asset.id }, data: { metadata: { ...metadata, retentionFileRemovedAt: new Date().toISOString() } } });
    removed++;
  }
  const signatures = await db.leaseSignatureSigner.findMany({ where: { envelope: { orgId }, signatureAssetKey: { not: null } }, select: { id: true, signatureAssetKey: true }, take: 21 });
  for (const signer of signatures) {
    if (removed === 20 || Date.now() >= deadline) return false;
    if (!signer.signatureAssetKey!.startsWith(`organizations/${orgId}/`)) throw new Error("Signature file ownership is invalid.");
    await storage.deleteFile(signer.signatureAssetKey!);
    await db.leaseSignatureSigner.update({ where: { id: signer.id }, data: { signatureAssetKey: null } });
    removed++;
  }
  for (const delegate of [db.accountingRequest, db.accountingVendorBill, db.expenditure]) {
    // These finance tables can also contain legacy files without an Asset row.
    const table = delegate as unknown as {
      findMany(args: unknown): Promise<{ id: string; attachmentKey: string | null }[]>;
      updateMany(args: unknown): Promise<unknown>;
    };
    const rows = await table.findMany({ where: { orgId, attachmentKey: { not: null } }, select: { id: true, attachmentKey: true }, take: 21 });
    for (const row of rows) {
      if (removed === 20 || Date.now() >= deadline) return false;
      const shared = await db.asset.findFirst({ where: { orgId: { not: orgId }, key: row.attachmentKey! }, select: { id: true } });
      if (!shared) await removeAsset({ orgId, key: row.attachmentKey!, metadata: null } as Asset);
      await table.updateMany({ where: { id: row.id, orgId, attachmentKey: row.attachmentKey }, data: { attachmentKey: null } });
      removed++;
    }
  }
  return true;
}
