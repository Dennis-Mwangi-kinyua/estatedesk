import assert from "node:assert/strict";
import { it } from "node:test";
import { uploadCloudflareImage, deleteCloudflareImage } from "../../apps/web/src/lib/uploads/cloudflare-images";
import { validateImageBytes } from "../../apps/web/src/lib/uploads/secure-image";

it("uploads validated bytes, rejects failed uploads and missing variants, and scopes deletion", async () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;
  try {
    for (const name of ["CF_IMAGES_API_TOKEN", "CF_IMAGES_ACCOUNT_ID", "CLOUDFLARE_ACCOUNT_ID", "CF_IMAGES_HASH", "NEXT_PUBLIC_CF_IMAGES_ACCOUNT_HASH", "CLOUDFLARE_ACCOUNT_HASH"]) delete process.env[name];
    const image = validateImageBytes(Buffer.from([0xff, 0xd8, 0xff]));
    assert.equal(await uploadCloudflareImage(image, "photo.jpg"), null);
    process.env.CF_IMAGES_API_TOKEN = "test-token";
    await assert.rejects(uploadCloudflareImage(image, "photo.jpg"), /requires/);
    process.env.CF_IMAGES_ACCOUNT_ID = "account";
    process.env.CF_IMAGES_HASH = "hash";
    process.env.NEXT_PUBLIC_CF_IMAGES_PUBLIC_VARIANT = "public";
    const url = "https://imagedelivery.net/hash/image-id/public";
    globalThis.fetch = async (input, options) => {
      assert.match(String(input), /accounts\/account\/images\/v1/);
      assert.equal((options?.headers as Record<string, string>).Authorization, "Bearer test-token");
      if (options?.method === "DELETE") return Response.json({ success: true });
      assert.ok(options?.body instanceof FormData);
      const file = options.body.get("file") as File;
      assert.equal(file.type, "image/jpeg");
      assert.equal(file.size, 3);
      return Response.json({ success: true, result: { id: "image-id", variants: [url] } });
    };
    assert.deepEqual(await uploadCloudflareImage(image, "photo.jpg"), { key: url, publicUrl: url, storage: "cloudflare" });
    assert.equal(await deleteCloudflareImage(url), true);
    assert.equal(await deleteCloudflareImage("/uploads/old.jpg"), false);
    await assert.rejects(deleteCloudflareImage("https://imagedelivery.net/other/image/public"), /different account/);
    globalThis.fetch = async () => Response.json({ success: false }, { status: 403 });
    await assert.rejects(uploadCloudflareImage(image, "photo.jpg"), /upload failed/);
    let deleted = false;
    globalThis.fetch = async (_input, options) => {
      if (options?.method === "DELETE") { deleted = true; return Response.json({ success: true }); }
      return Response.json({ success: true, result: { id: "image-id", variants: [] } });
    };
    await assert.rejects(uploadCloudflareImage(image, "photo.jpg"), /variant/);
    assert.ok(deleted);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of Object.keys(process.env)) if (!(name in originalEnv)) delete process.env[name];
    Object.assign(process.env, originalEnv);
  }
});
