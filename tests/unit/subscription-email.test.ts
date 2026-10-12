import assert from "node:assert/strict";
import test from "node:test";
import { sendTransactionalEmail } from "../../services/notifications/src/lib/email";

test("invoice email includes its PDF attachment and reports delivery errors", async () => {
  const originalFetch = globalThis.fetch;
  const oldKey = process.env.RESEND_API_KEY;
  const oldFrom = process.env.EMAIL_FROM;
  try {
    process.env.RESEND_API_KEY = "test-key";
    process.env.EMAIL_FROM = "billing@example.com";
    let payload: Record<string, unknown> = {};
    globalThis.fetch = async (_url, options) => {
      payload = JSON.parse(String(options?.body));
      return new Response("{}", { status: 200 });
    };
    const attachment = { filename: "invoice.pdf", content: Buffer.from("%PDF-test").toString("base64") };
    await sendTransactionalEmail("customer@example.com", "Invoice", "Payment instructions", [attachment]);
    assert.deepEqual(payload.to, ["customer@example.com"]);
    assert.deepEqual(payload.attachments, [attachment]);
    globalThis.fetch = async () => new Response("{}", { status: 403 });
    await assert.rejects(sendTransactionalEmail("customer@example.com", "Invoice", "Body"), /rejected delivery \(403\)/);
    delete process.env.RESEND_API_KEY;
    await assert.rejects(sendTransactionalEmail("customer@example.com", "Invoice", "Body"), /not configured/);
  } finally {
    globalThis.fetch = originalFetch;
    if (oldKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = oldKey;
    if (oldFrom === undefined) delete process.env.EMAIL_FROM; else process.env.EMAIL_FROM = oldFrom;
  }
});
