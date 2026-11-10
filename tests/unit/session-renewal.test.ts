import assert from "node:assert/strict";
import { it } from "node:test";
import { storeRenewedSession } from "../../apps/mobile/src/session-renewal";
import { ApiError } from "../../apps/mobile/src/http-response";

it("stores the renewed native credential before continuing", async () => {
  let value = "";
  let cleared = false;
  await storeRenewedSession({ sessionCookie: "estatedesk_session=fixture-token" }, { save: async cookie => { value = cookie; }, clear: async () => { cleared = true; } });
  assert.equal(value, "estatedesk_session=fixture-token");
  assert.equal(cleared, false);
});
it("requires sign-in and clears local state when renewal cannot be stored or parsed", async () => {
  for (const result of [{ sessionCookie: "estatedesk_session=fixture-token" }, {}]) {
    let cleared = false;
    await assert.rejects(storeRenewedSession(result, { save: async () => { throw Error("keychain unavailable"); }, clear: async () => { cleared = true; } }), (error: unknown) => error instanceof ApiError && error.status === 401 && error.message.includes("Password updated"));
    assert.equal(cleared, true);
  }
});
it("keeps setup recovery messages distinct from password-change recovery", async () => {
  await assert.rejects(storeRenewedSession({}, { save: async () => {}, clear: async () => {} }, "Account setup completed. Sign in again to continue."), (error: unknown) => error instanceof ApiError && error.status === 401 && error.message.startsWith("Account setup completed"));
});
