import assert from "node:assert/strict";
import { test } from "node:test";
import { generateKeyPairSync, verify } from "node:crypto";
import { serviceAccountAssertion, submitSitemaps } from "../../scripts/submit-sitemaps.mjs";

test("Google assertions have a verifiable signature, limited scope and one-hour expiry", () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwt = serviceAccountAssertion({ type: "service_account", client_email: "test@example.test", private_key: privateKey.export({ type: "pkcs8", format: "pem" }) }, 1000);
  const [header, payload, signature] = jwt.split(".");
  assert.ok(verify("RSA-SHA256", Buffer.from(`${header}.${payload}`), publicKey, Buffer.from(signature, "base64url")));
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
  assert.equal(claims.exp - claims.iat, 3600);
  assert.equal(claims.aud, "https://oauth2.googleapis.com/token");
  assert.equal(claims.scope, "https://www.googleapis.com/auth/webmasters");
});

test("missing credentials do not produce a false submission success", async () => {
  await assert.rejects(submitSitemaps({}, async () => { throw new Error("Should not fetch"); }), /No submissions were made/);
});
