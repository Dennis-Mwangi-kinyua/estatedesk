import "server-only";

import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";

export async function readAssetBytes(key: string): Promise<Uint8Array> {
  if (key.startsWith("database:")) {
    const asset = await prisma.asset.findUnique({ where: { id: key.slice("database:".length) }, select: { metadata: true, deletedAt: true } });
    const metadata = asset?.metadata as { pdfBase64?: string } | null;
    if (!asset || asset.deletedAt || !metadata?.pdfBase64) throw new Error("Stored agreement not found.");
    return new Uint8Array(Buffer.from(metadata.pdfBase64, "base64"));
  }
  if (/^https?:\/\//.test(key)) {
    const response = await fetch(key, { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Unable to read the stored document.");
    }

    return new Uint8Array(await response.arrayBuffer());
  }

  return storage.downloadFile(key);
}