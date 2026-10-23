import assert from "node:assert/strict";
import { test } from "node:test";
import { deniedAccessAction } from "../../apps/web/src/lib/audit/denied-access-action";

test("background route loading is recorded separately from user access attempts", () => {
  for (const values of [
    { "next-router-prefetch": "1" },
    { purpose: "prefetch" },
    { "sec-purpose": "prefetch;prerender" },
  ] as Record<string, string>[]) assert.equal(deniedAccessAction(new Headers(values)), "ACCESS_PREFETCH_DENIED");
});

test("navigation, RSC navigation and submitted actions retain denied-access auditing", () => {
  for (const values of [
    {}, { rsc: "1" }, { purpose: "navigate" },
    { "next-action": "action-id", "next-router-prefetch": "1" },
  ] as Record<string, string>[]) assert.equal(deniedAccessAction(new Headers(values)), "ACCESS_DENIED");
});
