import assert from "node:assert/strict";
import test from "node:test";
import { MpesaRequestError, queryMpesaStkPush, requestMpesaStkPush } from "../../apps/web/src/lib/mpesa/client";

test("STK transport rejects refused requests and preserves unknown provider results", async () => {
  const keys = ["ORG_ID", "ENVIRONMENT", "CONSUMER_KEY", "CONSUMER_SECRET", "SHORTCODE", "PASSKEY", "CALLBACK_SECRET", "CALLBACK_URL"].map(key => `MPESA_${key}`);
  keys.push("MPESA_ADDITIONAL_PREFIXES");
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  const input = { orgId: "org-test", amount: 1, phone: "0712345678", accountReference: "rent", transactionDesc: "rent" };
  const bodies: Record<string, unknown>[] = [];
  let reply: Record<string, unknown> = {};
  let httpStatus = 200;
  try {
    for (const key of keys) process.env[key] = "test";
    process.env.MPESA_ADDITIONAL_PREFIXES = "";
    process.env.MPESA_ORG_ID = input.orgId;
    process.env.MPESA_ENVIRONMENT = "sandbox";
    process.env.MPESA_SHORTCODE = "174379";
    globalThis.fetch = async (url, init) => {
      if (String(url).includes("/oauth/")) return Response.json({ access_token: "test-token" });
      assert.ok(String(url).startsWith("https://sandbox.safaricom.co.ke/"));
      bodies.push(JSON.parse(String(init?.body)));
      return Response.json(reply, { status: httpStatus });
    };
    reply = { ResponseCode: "1", ResponseDescription: "Rejected", CheckoutRequestID: "not-accepted" };
    await assert.rejects(requestMpesaStkPush(input), error => error instanceof MpesaRequestError && error.rejected);
    reply = { ResponseCode: "0" };
    await assert.rejects(requestMpesaStkPush(input), error => error instanceof MpesaRequestError && error.rejected);
    reply = { ResponseCode: "0", CheckoutRequestID: "accepted", MerchantRequestID: "merchant" };
    assert.equal((await requestMpesaStkPush(input)).checkoutRequestId, "accepted");
    assert.equal(bodies.at(-1)?.PhoneNumber, "254712345678");
    assert.equal(bodies.at(-1)?.BusinessShortCode, "174379");
    reply = { errorCode: "500.001.1001", errorMessage: "" };
    httpStatus = 500;
    await assert.rejects(queryMpesaStkPush(input.orgId, "accepted"), error => error instanceof MpesaRequestError && !error.rejected && error.message.includes("500.001.1001"));
    httpStatus = 200;
    reply = { ResultCode: "1037", ResultDesc: "DS timeout user cannot be reached." };
    assert.deepEqual(await queryMpesaStkPush(input.orgId, "accepted"), { resultCode: 1037, description: reply.ResultDesc });
    assert.equal(bodies.at(-1)?.CheckoutRequestID, "accepted");
    assert.equal(bodies.at(-1)?.PhoneNumber, undefined); // Queries never send another prompt.
    reply = { ResponseCode: "0" }; // Acknowledgement alone is not payment success.
    assert.equal((await queryMpesaStkPush(input.orgId, "accepted")).resultCode, null);
    reply = { ResultCode: "0", ResultDesc: "Success" };
    assert.equal((await queryMpesaStkPush(input.orgId, "accepted")).resultCode, 0);
    const requests = bodies.length;
    await assert.rejects(queryMpesaStkPush("another-org", "accepted"));
    await assert.rejects(requestMpesaStkPush({ ...input, phone: "123" }));
    assert.equal(bodies.length, requests);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
