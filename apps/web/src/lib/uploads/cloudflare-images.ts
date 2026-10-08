import type { ValidatedImage } from "./secure-image";

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
