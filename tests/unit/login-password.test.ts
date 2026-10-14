import assert from "node:assert/strict";
import { test } from "node:test";
import bcrypt from "bcryptjs";
import { verifyLoginPassword } from "../../apps/web/src/lib/auth/verify-login-password";

test("login accepts only a matching stored hash and unknown accounts never authenticate", async () => {
  const hash = await bcrypt.hash("Test-only-password-123", 12);
  assert.equal(await verifyLoginPassword("Test-only-password-123", hash), true);
  assert.equal(await verifyLoginPassword("incorrect", hash), false);
  assert.equal(await verifyLoginPassword("Test-only-password-123", null), false);
});
