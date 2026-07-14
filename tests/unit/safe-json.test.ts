import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { serializeJsonForHtml } from "../../apps/web/src/lib/security/safe-json";

describe("HTML-safe JSON serialization", () => {
  it("prevents script-element breakout from stored content", () => {
    const serialized = serializeJsonForHtml({
      name: "</script><script>alert('xss')</script>",
      detail: "A&B > C",
    });

    assert.doesNotMatch(serialized, /<\/script/i);
    assert.doesNotMatch(serialized, /<script/i);
    assert.match(serialized, /\\u003c\/script\\u003e/);
    assert.match(serialized, /A\\u0026B \\u003e C/);
  });
});
