import assert from "node:assert/strict";
import { test } from "node:test";
import { PayloadTooLargeError, readBoundedJson } from "../../apps/web/src/lib/security/bounded-json";

test("bounded JSON rejects oversized declared and streamed bodies", async () => {
  await assert.rejects(readBoundedJson(new Request("https://example.test", { method: "POST", body: "{}", headers: { "content-length": "200" } }), 10), PayloadTooLargeError);
  await assert.rejects(readBoundedJson(new Request("https://example.test", { method: "POST", body: JSON.stringify({ value: "x".repeat(100) }) }), 10), PayloadTooLargeError);
  assert.deepEqual(await readBoundedJson(new Request("https://example.test", { method: "POST", body: '{"ok":true}' }), 20), { ok: true });
  await assert.rejects(readBoundedJson(new Request("https://example.test", { method: "POST", body: "invalid" }), 20), SyntaxError);
});

test("bounded raw text preserves signed bytes and stops oversized streams without Content-Length", async () => {
  const { readBoundedText } = await import("../../apps/web/src/lib/security/bounded-json");
  const raw = '{"message":"Habari 🌍"}\n';
  assert.equal(await readBoundedText(new Request("https://example.test", { method: "POST", body: raw }), Buffer.byteLength(raw)), raw);
  await assert.rejects(readBoundedText(new Request("https://example.test", { method: "POST", body: "🌍".repeat(10) }), 20), PayloadTooLargeError);
  assert.equal(await readBoundedText(new Request("https://example.test"), 20), "");
});
