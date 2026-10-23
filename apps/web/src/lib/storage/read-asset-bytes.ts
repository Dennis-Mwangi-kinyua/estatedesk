import "server-only";

import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { ASSET_READ_TIMEOUT_MS, MAX_ASSET_BYTES, collectAssetBytes, trustedAssetUrl } from "./read-limits";

export async function readAssetBytes(key: string): Promise<Uint8Array> {
  if (key.startsWith("database:")) {
    const asset = await prisma.asset.findUnique({ where: { id: key.slice("database:".length) }, select: { metadata: true, deletedAt: true } });
    const metadata = asset?.metadata as { pdfBase64?: string } | null;
    if (!asset || asset.deletedAt || !metadata?.pdfBase64) throw new Error("Stored agreement not found.");
    if (typeof metadata.pdfBase64 !== "string" || Buffer.byteLength(metadata.pdfBase64, "base64") > MAX_ASSET_BYTES) throw new Error("Stored file exceeds the download limit.");
    return new Uint8Array(Buffer.from(metadata.pdfBase64, "base64"));
  }
  if (/^https?:\/\//.test(key)) {
    const response = await fetch(trustedAssetUrl(key), { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(ASSET_READ_TIMEOUT_MS) });

    if (!response.ok) {
      await response.body?.cancel();
      throw new Error("Unable to read the stored document.");
    }

    if (!response.body) throw new Error("Stored document is empty.");
    const reader = response.body!.getReader();
    async function* chunks() {
      while (true) {
        const next = await reader.read();
        if (next.done) return;
        yield next.value;
      }
    }
    try {
      return await collectAssetBytes(chunks(), Number(response.headers.get("content-length") ?? 0));
    } finally {
      await reader.cancel();
    }
  }

  return storage.downloadFile(key);
}
