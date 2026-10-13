import assert from "node:assert/strict";
import test from "node:test";
import { safeReturnTo } from "../../apps/web/src/lib/auth/safe-return-to";

test("accepts same-origin application paths and preserves query state", () => {
  assert.equal(
    safeReturnTo("/sign-lease/token?step=review#document"),
    "/sign-lease/token?step=review#document",
  );
});

test("rejects external and ambiguous return paths", () => {
  for (const value of [
    "https://attacker.example",
    "//attacker.example/path",
    "/\\attacker.example/path",
    "/%2f%2fattacker.example/path",
    "/%5c%5cattacker.example/path",
    "/path\nheader: value",
  ]) {
    assert.equal(safeReturnTo(value), null, `expected rejection for ${JSON.stringify(value)}`);
  }
});
