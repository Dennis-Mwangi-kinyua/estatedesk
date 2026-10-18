import test from "node:test";
import assert from "node:assert/strict";
import { ApiError, readMobileResponse } from "../../apps/mobile/src/http-response";
test("HTML authorization failures retain 401 so native session cleanup runs", async () => {
  await assert.rejects(() => readMobileResponse(new Response("<html>Sign in</html>", { status: 401 })), error => error instanceof ApiError && error.status === 401);
});
test("API validation messages are preserved and HTML is never displayed to the user", async () => {
  await assert.rejects(() => readMobileResponse(Response.json({ error: "Choose a unit." }, { status: 400 })), error => error instanceof ApiError && error.message === "Choose a unit.");
  await assert.rejects(() => readMobileResponse(new Response("<html>Not found</html>", { status: 404 })), error => error instanceof ApiError && error.status === 404 && error.message.includes("server update") && !error.message.includes("<html>"));
});
test("successful JSON decodes while redirected HTML produces a recoverable error", async () => {
  assert.deepEqual(await readMobileResponse(Response.json({ ok: true })), { ok: true });
  await assert.rejects(() => readMobileResponse(new Response("<html>Are you lost?</html>")), error => error instanceof ApiError && error.status === 502);
});
