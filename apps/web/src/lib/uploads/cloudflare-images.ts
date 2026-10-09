import type { ValidatedImage } from "./secure-image";
import { createHmac } from "node:crypto";

function config() {
  const token = process.env.CF_IMAGES_API_TOKEN?.trim();
  const accountId = (process.env.CF_IMAGES_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID)?.trim();
  const hash = (process.env.CF_IMAGES_HASH || process.env.NEXT_PUBLIC_CF_IMAGES_ACCOUNT_HASH || process.env.CLOUDFLARE_ACCOUNT_HASH)?.trim();
  if (!token && !accountId && !hash) return null;
  if (!token || !accountId || !hash) {
    throw new Error("Cloudflare Images requires an API token, account ID, and account hash.");
  }
  return { token, accountId, hash };
}

export async function uploadPrivateCloudflareImage(image: ValidatedImage, fileName: string) {
  const settings = config();
  if (!settings) return null;
  const form = new FormData();
  form.set("file", new Blob([new Uint8Array(image.buffer)], { type: image.mimeType }), fileName);
  form.set("requireSignedURLs", "true");
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(settings.accountId)}/images/v1`, {
    method: "POST", headers: { Authorization: `Bearer ${settings.token}` }, body: form,
    signal: AbortSignal.timeout(30_000),
  });
  const result = await response.json() as { success?: boolean; result?: { id?: string; requireSignedURLs?: boolean } };
  if (!response.ok || !result.success || !result.result?.id || result.result.requireSignedURLs !== true) {
    throw new Error("Private Cloudflare image upload failed.");
  }
  return { imageId: result.result.id, storage: "cloudflare-private" as const };
}

export async function readPrivateCloudflareImage(imageId: string) {
  const settings = config();
  if (!settings) throw new Error("Cloudflare Images is not configured.");
  let response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(settings.accountId)}/images/v1/${encodeURIComponent(imageId)}/blob`, {
    headers: { Authorization: `Bearer ${settings.token}` }, cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  // Some Images Edit tokens allow signing keys but do not allow original exports.
  if (response.status === 403) {
    const keysResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(settings.accountId)}/images/v1/keys`, {
      headers: { Authorization: `Bearer ${settings.token}` }, cache: "no-store", signal: AbortSignal.timeout(30_000),
    });
    const keys = await keysResponse.json() as { success?: boolean; result?: { keys?: { value?: string }[] } };
    const key = keys.result?.keys?.[0]?.value;
    if (!keysResponse.ok || !keys.success || !key) throw new Error("Cloudflare image signing is unavailable.");
    const variant = process.env.NEXT_PUBLIC_CF_IMAGES_PUBLIC_VARIANT?.trim() || "public";
    const url = new URL(`https://imagedelivery.net/${encodeURIComponent(settings.hash)}/${encodeURIComponent(imageId)}/${encodeURIComponent(variant)}`);
    url.searchParams.set("exp", String(Math.floor(Date.now() / 1000) + 60));
    url.searchParams.set("sig", createHmac("sha256", key).update(`${url.pathname}?${url.searchParams}`).digest("hex"));
    response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(30_000) });
  }
  if (!response.ok) throw new Error("Private Cloudflare image download failed.");
  return Buffer.from(await response.arrayBuffer());
}

export async function uploadCloudflareImage(image: ValidatedImage, fileName: string) {
  const settings = config();
  if (!settings) return null;
  const form = new FormData();
  form.set("file", new Blob([new Uint8Array(image.buffer)], { type: image.mimeType }), fileName);
  form.set("requireSignedURLs", "false");
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(settings.accountId)}/images/v1`, {
    method: "POST",
    headers: { Authorization: `Bearer ${settings.token}` },
    body: form,
    signal: AbortSignal.timeout(30_000),
  });
  const result = await response.json() as { success?: boolean; result?: { id?: string; variants?: string[] } };
  if (!response.ok || !result.success || !result.result?.id) {
    throw new Error("Cloudflare image upload failed. Check the Images API token and account configuration.");
  }
  const variant = process.env.NEXT_PUBLIC_CF_IMAGES_PUBLIC_VARIANT?.trim() || "public";
  const url = `https://imagedelivery.net/${encodeURIComponent(settings.hash)}/${encodeURIComponent(result.result.id)}/${encodeURIComponent(variant)}`;
  if (!result.result.variants?.includes(url)) {
    await deleteCloudflareImage(url);
    throw new Error(`Cloudflare Images delivery variant '${variant}' is not configured.`);
  }
  return { key: url, publicUrl: url, storage: "cloudflare" as const };
}

export async function deleteCloudflareImage(key: string): Promise<boolean> {
  if (!key.startsWith("https://imagedelivery.net/")) return false;
  const settings = config();
  if (!settings) throw new Error("Cloudflare Images is not configured.");
  const url = new URL(key);
  const segments = url.pathname.split("/");
  if (decodeURIComponent(segments[1] || "") !== settings.hash || !segments[2]) {
    throw new Error("Cloudflare image belongs to a different account.");
  }
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(settings.accountId)}/images/v1/${encodeURIComponent(decodeURIComponent(segments[2]))}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${settings.token}` },
    signal: AbortSignal.timeout(30_000),
  });
  const result = await response.json() as { success?: boolean };
  if (!response.ok || !result.success) throw new Error("Cloudflare image deletion failed.");
  return true;
}
