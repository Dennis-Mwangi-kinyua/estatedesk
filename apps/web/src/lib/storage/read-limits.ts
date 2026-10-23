export const MAX_ASSET_BYTES = 25 * 1024 * 1024;
export const ASSET_READ_TIMEOUT_MS = 15_000;

export async function collectAssetBytes(chunks: AsyncIterable<Uint8Array>, contentLength?: number): Promise<Uint8Array> {
  if (contentLength !== undefined && contentLength > MAX_ASSET_BYTES) throw new Error("Stored file exceeds the download limit.");
  const parts: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of chunks) {
    size += chunk.byteLength;
    if (size > MAX_ASSET_BYTES) throw new Error("Stored file exceeds the download limit.");
    parts.push(chunk);
  }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.byteLength; }
  return result;
}

export function trustedAssetUrl(key: string): URL {
  const url = new URL(key);
  const bases = [process.env.S3_PUBLIC_BASE_URL];
  if (process.env.S3_BUCKET && process.env.S3_REGION) {
    bases.push(`https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com`);
  }
  const trusted = bases.some(base => {
    if (!base) return false;
    const allowed = new URL(base);
    const prefix = `${allowed.pathname.replace(/\/+$/, "")}/`;
    return url.origin === allowed.origin && url.pathname.startsWith(prefix);
  });
  if (url.protocol !== "https:" || url.username || url.password || !trusted) {
    throw new Error("Stored file URL is not trusted.");
  }
  return url;
}
