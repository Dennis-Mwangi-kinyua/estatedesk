import assert from "node:assert/strict";
import { createHmac } from "crypto";
import test from "node:test";
import {
  buildKcbIpnTransactionKey,
  kcbIpnAck,
  kcbIpnAmount,
  kcbIpnMatchCandidates,
  parseKcbIpnPayload,
  verifyKcbIpnSignature,
} from "../../apps/web/src/lib/kcb/ipn";

const sample = {
  transactionReference: "FT00026252",
  requestId: "c7d702cb-6b5f-4fa6-8b57-436d0f789017",
  channelCode: "202",
  timestamp: "2021111103005",
  transactionAmount: "100.00",
  currency: "KES",
  customerReference: "INV-0001",
  customerName: "John Doe",
  customerMobileNumber: "25471111111",
  balance: "100000.00",
  narration: "Payment for goods",
  creditAccountIdentifier: "JD001",
  organizationShortCode: "777777",
  tillNumber: "150150",
};

test("parses KCB Buni IPN sample payload", () => {
  const parsed = parseKcbIpnPayload(sample);
  assert.ok(parsed);
  assert.equal(parsed.transactionReference, "FT00026252");
  assert.equal(kcbIpnAmount(parsed), 100);
  assert.ok(kcbIpnMatchCandidates(parsed).includes("FT00026252"));
  assert.ok(kcbIpnMatchCandidates(parsed).includes("INV-0001"));
});

test("rejects invalid IPN payload", () => {
  assert.equal(parseKcbIpnPayload({ foo: "bar" }), null);
});

test("builds stable KCB transaction keys", () => {
  const parsed = parseKcbIpnPayload(sample)!;
  assert.equal(
    buildKcbIpnTransactionKey(parsed),
    "BANK:KCB:JD001:FT00026252",
  );
});

test("ack payload matches Buni expected shape", () => {
  assert.deepEqual(kcbIpnAck("FT00026252", 0, "Notification received"), {
    transactionID: "FT00026252",
    statusCode: 0,
    statusMessage: "Notification received",
  });
});

test("signature verification accepts HMAC hex", () => {
  const body = JSON.stringify(sample);
  const secret = "test-secret";
  const sig = createHmac("sha256", secret).update(body, "utf8").digest("hex");

  assert.equal(
    verifyKcbIpnSignature({
      rawBody: body,
      signatureHeader: sig,
      querySecret: null,
      expectedSecret: secret,
    }).ok,
    true,
  );

  assert.equal(
    verifyKcbIpnSignature({
      rawBody: body,
      signatureHeader: "bad",
      querySecret: null,
      expectedSecret: secret,
    }).ok,
    false,
  );

  assert.equal(
    verifyKcbIpnSignature({
      rawBody: body,
      signatureHeader: null,
      querySecret: secret,
      expectedSecret: secret,
    }).ok,
    true,
  );
});

test("signature verification skips when secret unset", () => {
  assert.equal(
    verifyKcbIpnSignature({
      rawBody: "{}",
      signatureHeader: null,
      querySecret: null,
      expectedSecret: undefined,
    }).ok,
    true,
  );
});
