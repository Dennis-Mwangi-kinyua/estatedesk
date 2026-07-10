import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

const originalAuthSecret = process.env.AUTH_SECRET;

async function loadCookiesModule() {
  return import("../../apps/web/src/lib/auth/cookies");
}

describe("session cookie hardening", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "test-cookie-signing-secret";
  });

  afterEach(() => {
    if (originalAuthSecret === undefined) {
      delete process.env.AUTH_SECRET;
    } else {
      process.env.AUTH_SECRET = originalAuthSecret;
    }
  });

  it("creates and verifies signed session cookie values", async () => {
    const cookiesModule = await loadCookiesModule();
    const token = "a".repeat(64);
    const signed = cookiesModule.createSessionCookieValue(token);

    assert.match(signed, /^v1\./);
    assert.equal(cookiesModule.parseSessionCookieValue(signed), token);
    assert.equal(cookiesModule.hasValidSessionCookieShape(signed), true);
  });

  it("rejects tampered session cookie values", async () => {
    const cookiesModule = await loadCookiesModule();
    const token = "b".repeat(64);
    const signed = cookiesModule.createSessionCookieValue(token);
    const tampered = `${signed.slice(0, -1)}0`;

    assert.equal(cookiesModule.parseSessionCookieValue(tampered), null);
  });

  it("accepts legacy unsigned session tokens during upgrade", async () => {
    const cookiesModule = await loadCookiesModule();
    const legacyToken = "c".repeat(64);

    assert.equal(cookiesModule.parseSessionCookieValue(legacyToken), legacyToken);
  });

  it("creates user-bound platform unlock cookies with expiry", async () => {
    const cookiesModule = await loadCookiesModule();
    const expiresAtUnix = Math.floor(Date.now() / 1000) + 300;
    const signed = cookiesModule.createPlatformUnlockCookieValue({
      userId: "user_123",
      expiresAtUnix,
    });

    const parsed = cookiesModule.parsePlatformUnlockCookieValue(signed);

    assert.deepEqual(parsed, {
      userId: "user_123",
      expiresAtUnix,
    });
  });

  it("rejects expired platform unlock cookies", async () => {
    const cookiesModule = await loadCookiesModule();
    const signed = cookiesModule.createPlatformUnlockCookieValue({
      userId: "user_123",
      expiresAtUnix: Math.floor(Date.now() / 1000) - 10,
    });

    assert.equal(cookiesModule.parsePlatformUnlockCookieValue(signed), null);
  });

  it("uses unprefixed cookie names outside production", async () => {
    const policyModule = await import("../../apps/web/src/lib/auth/cookie-policy");

    assert.equal(policyModule.getSessionCookieName(), "estatedesk_session");
    assert.equal(
      policyModule.getPlatformUnlockCookieName(),
      "estatedesk_platform_api_keys_unlocked",
    );
  });
});