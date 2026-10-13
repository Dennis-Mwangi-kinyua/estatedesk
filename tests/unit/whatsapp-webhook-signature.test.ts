import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  verifyMetaWhatsappSignature,
  verifyMetaWhatsappToken,
} from "../../apps/web/src/lib/whatsapp/webhook-signature";

test("verifies Meta signatures against the exact request body", () => {
  const body = '{"entry":[]}';
  const secret = "meta-app-secret";
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  assert.equal(verifyMetaWhatsappSignature(body, `sha256=${signature}`, secret), true);
  assert.equal(verifyMetaWhatsappSignature(`${body} `, `sha256=${signature}`, secret), false);
  assert.equal(verifyMetaWhatsappSignature(body, "sha256=bad", secret), false);
});

test("compares webhook verification tokens without accepting missing values", () => {
  assert.equal(verifyMetaWhatsappToken("verify-token", "verify-token"), true);
  assert.equal(verifyMetaWhatsappToken("wrong", "verify-token"), false);
  assert.equal(verifyMetaWhatsappToken(null, "verify-token"), false);
});
