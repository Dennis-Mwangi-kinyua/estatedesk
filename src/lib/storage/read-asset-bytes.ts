import "server-only";

import { storage } from "@/lib/storage";

export async function readAssetBytes(key: string): Promise<Uint8Array> {
  if (/^https?:\/\//.test(key)) {
    const response = await fetch(key, { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Unable to read the stored document.");
    }

    return new Uint8Array(await response.arrayBuffer());
  }

  return storage.downloadFile(key);
}