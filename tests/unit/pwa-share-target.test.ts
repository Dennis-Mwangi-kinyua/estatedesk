import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildShareTargetQuery } from "../../apps/web/src/lib/pwa/share-target";

describe("share target helpers", () => {
  it("builds issue draft query params from shared title and text", () => {
    const query = buildShareTargetQuery({
      title: "Leaking sink",
      text: "Water under the kitchen cabinet since morning.",
      url: "https://example.com/photo",
    });

    assert.match(query, /title=Leaking\+sink/);
    assert.match(query, /description=/);
    assert.match(query, /kitchen\+cabinet/);
    assert.match(query, /example\.com/);
  });

  it("returns an empty query when nothing was shared", () => {
    assert.equal(buildShareTargetQuery({}), "");
  });
});