import assert from "node:assert/strict";
import { test } from "node:test";
import { collectAssetBytes, MAX_ASSET_BYTES, trustedAssetUrl } from "../../apps/web/src/lib/storage/read-limits";

test("asset reads enforce declared and streamed size limits and close rejected streams", async () => {
  let closed = false;
  async function* oversized() {
    try { yield new Uint8Array(MAX_ASSET_BYTES); yield new Uint8Array(1); }
    finally { closed = true; }
  }
  await assert.rejects(collectAssetBytes(oversized()), /download limit/);
  assert.equal(closed, true);
  await assert.rejects(collectAssetBytes(oversized(), MAX_ASSET_BYTES + 1), /download limit/);
  async function* valid() { yield new Uint8Array([1, 2]); yield new Uint8Array([3]); }
  assert.deepEqual(await collectAssetBytes(valid()), new Uint8Array([1, 2, 3]));
});

test("asset URLs require a configured HTTPS origin and path", () => {
  const original = process.env.S3_PUBLIC_BASE_URL;
  process.env.S3_PUBLIC_BASE_URL = "https://cdn.example.test/assets";
  try {
    assert.equal(trustedAssetUrl("https://cdn.example.test/assets/file.pdf").hostname, "cdn.example.test");
    for (const url of ["http://cdn.example.test/assets/file", "https://cdn.example.test.evil.test/assets/file", "https://cdn.example.test/other/file", "https://cdn.example.test/assets/../private", "https://user:pass@cdn.example.test/assets/file", "http://169.254.169.254/latest/meta-data"]) {
      assert.throws(() => trustedAssetUrl(url), /not trusted/);
    }
  } finally {
    if (original === undefined) delete process.env.S3_PUBLIC_BASE_URL;
    else process.env.S3_PUBLIC_BASE_URL = original;
  }
});
