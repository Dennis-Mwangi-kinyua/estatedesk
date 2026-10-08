import assert from "node:assert/strict";
import { test } from "node:test";
import { sendVerificationEmail, sendPasswordResetEmail } from "../../services/notifications/src/lib/email";

test("transactional emails require configuration and propagate delivery failures", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.EMAIL_FROM;
  try {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    await assert.rejects(sendVerificationEmail({ to: "owner@example.test", verifyUrl: "https://example.test/verify-email?token=test" }), /not configured/);
    process.env.RESEND_API_KEY = "test-key";
    process.env.EMAIL_FROM = "EstateDesk <no-reply@example.test>";
    globalThis.fetch = async (_input, init) => {
      const payload = JSON.parse(String(init?.body));
      assert.equal(payload.from, process.env.EMAIL_FROM);
      assert.deepEqual(payload.to, ["owner@example.test"]);
      assert.match(payload.text, /verify-email\?token=test/);
      return new Response('{"id":"test"}', { status: 200 });
    };
    await sendVerificationEmail({ to: "owner@example.test", verifyUrl: "https://example.test/verify-email?token=test" });
    globalThis.fetch = async () => new Response("rejected", { status: 403 });
    await assert.rejects(sendPasswordResetEmail({ to: "owner@example.test", resetUrl: "https://example.test/reset-password" }), /403/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = originalKey;
    if (originalFrom === undefined) delete process.env.EMAIL_FROM; else process.env.EMAIL_FROM = originalFrom;
  }
});
