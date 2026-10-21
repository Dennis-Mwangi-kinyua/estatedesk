import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Prisma } from "@prisma/client";
import { prisma } from "../apps/web/src/lib/prisma";
import { storePaymentProof, readPaymentProof } from "../apps/web/src/lib/payments/proof";
import { validateImageBytes } from "../apps/web/src/lib/uploads/secure-image";
import { readPrivateCloudflareImage, deleteCloudflareImage } from "../apps/web/src/lib/uploads/cloudflare-images";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apply = process.argv.includes("--apply");
const actorUserId = process.argv.find(arg => arg.startsWith("--actor="))?.slice(8);
const orgId = process.argv.find(arg => arg.startsWith("--org="))?.slice(6);
function cloudflareId(key: string) {
  const url = new URL(key);
  const hash = (process.env.CF_IMAGES_HASH || process.env.NEXT_PUBLIC_CF_IMAGES_ACCOUNT_HASH || process.env.CLOUDFLARE_ACCOUNT_HASH)?.trim();
  const parts = url.pathname.split("/");
  if (url.protocol !== "https:" || url.hostname !== "imagedelivery.net" || !hash || decodeURIComponent(parts[1] ?? "") !== hash || !parts[2]) throw new Error("Unrecognized legacy proof location.");
  return decodeURIComponent(parts[2]);
}
function localPaths(key: string) {
  if (!/^\/uploads\/payment-proof\/[a-zA-Z0-9_-]+\.(jpg|png|webp)$/.test(key)) throw new Error("Unrecognized legacy proof path.");
  return [path.join(root, "apps/web/public", key.slice(1)), path.join(root, "public", key.slice(1))];
}
async function legacyBytes(key: string) {
  if (key.startsWith("https://")) return readPrivateCloudflareImage(cloudflareId(key));
  for (const candidate of localPaths(key)) {
    try { return await readFile(candidate); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  }
  throw new Error("Legacy local proof is missing. Run on the original upload host.");
}
async function revokePublicCopy(key: string) {
  if (key.startsWith("https://")) {
    cloudflareId(key);
    await deleteCloudflareImage(key);
  } else {
    for (const candidate of localPaths(key)) {
      try { await unlink(candidate); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    }
  }
}
async function main() {
  if (apply && (!actorUserId || !await prisma.user.count({ where: { id: actorUserId } }))) throw new Error("Supply --actor=<existing-user-id> for the migration audit trail.");
  let migrated = 0;
  let failed = 0;
  let cursor: string | undefined;
  for (;;) {
    const assets = await prisma.asset.findMany({ where: { ...(orgId ? { orgId } : {}), metadata: { path: ["purpose"], equals: "payment_proof" } }, orderBy: { id: "asc" }, take: 100, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
    if (!assets.length) break;
    for (const asset of assets) {
      const metadata = asset.metadata as Prisma.JsonObject;
      const privateAsset = ["cloudflare-private", "s3-private", "local-private"].includes(String(metadata.storage));
      const legacyKey = typeof metadata.legacyPublicKey === "string" ? metadata.legacyPublicKey : !privateAsset ? asset.key : null;
      if (!legacyKey) continue;
      if (!apply) { console.log(`Would privatize/revoke public copy for asset ${asset.id}`); continue; }
      try {
        const payments = await prisma.payment.findMany({ where: { orgId: asset.orgId, callbackRaw: { path: ["proofAssetId"], equals: asset.id } }, select: { id: true, callbackRaw: true } });
        if (payments.length !== 1) throw new Error("Expected exactly one payment for this proof; review it manually.");
        if (!privateAsset) {
          const image = validateImageBytes(await legacyBytes(legacyKey), { maxBytes: 5 * 1024 * 1024 });
          const stored = await storePaymentProof(image, asset.fileName, asset.orgId);
          const newMetadata = { ...stored, paymentId: payments[0].id, legacyPublicKey: legacyKey };
          // Verify the private copy can be read before changing references or removing anything.
          const copy = await readPaymentProof({ ...asset, metadata: newMetadata as Prisma.JsonObject });
          if (!Buffer.from(copy).equals(image.buffer)) throw new Error("Private proof verification failed.");
          await prisma.$transaction(async tx => {
            await tx.asset.update({ where: { id: asset.id }, data: { key: `/api/payments/${payments[0].id}/proof`, metadata: newMetadata } });
            for (const payment of payments) {
              const current = await tx.payment.findUniqueOrThrow({ where: { id: payment.id }, select: { callbackRaw: true } });
              await tx.payment.update({ where: { id: payment.id }, data: { callbackRaw: { ...(current.callbackRaw as Prisma.JsonObject), proofImageUrl: `/api/payments/${payment.id}/proof` } } });
            }
            await tx.auditLog.create({ data: { orgId: asset.orgId, actorUserId: actorUserId!, action: "PAYMENT_PROOF_PRIVATIZED", entityType: "Asset", entityId: asset.id, metadata: { paymentIds: payments.map(payment => payment.id) } } });
          });
        } else {
          await readPaymentProof(asset); // A retry must still verify the private copy.
        }
        await revokePublicCopy(legacyKey);
        const current = await prisma.asset.findUniqueOrThrow({ where: { id: asset.id }, select: { metadata: true } });
        const cleaned = { ...(current.metadata as Prisma.JsonObject) };
        delete cleaned.legacyPublicKey;
        delete cleaned.publicUrl;
        await prisma.asset.update({ where: { id: asset.id }, data: { metadata: cleaned } });
        migrated++;
      } catch (error) {
        failed++;
        // Do not log bearer URLs or provider request bodies.
        console.error(`Asset ${asset.id} needs attention: ${error instanceof Error ? error.message : "migration failed"}`);
      }
    }
    cursor = assets.at(-1)!.id;
  }
  console.log(JSON.stringify({ mode: apply ? "apply" : "preview", migrated, failed }));
  if (failed) process.exitCode = 1;
}
main().catch(() => { console.error("Payment proof migration failed."); process.exitCode = 1; }).finally(() => prisma.$disconnect());
