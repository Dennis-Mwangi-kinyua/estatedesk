import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolvePublicRentalLocationHref } from "../../src/lib/public-rental-seo";

describe("public rental SEO helpers", () => {
  it("maps known locations to location landing pages", () => {
    assert.equal(resolvePublicRentalLocationHref("Ruiru Town"), "/vacancies/ruiru");
    assert.equal(resolvePublicRentalLocationHref("Westlands Nairobi"), "/vacancies/westlands");
    assert.equal(resolvePublicRentalLocationHref("nairobi"), "/vacancies/nairobi");
  });

  it("falls back to filtered vacancy search for unknown places", () => {
    assert.equal(
      resolvePublicRentalLocationHref("Unknown Estate"),
      "/vacancies?location=Unknown%20Estate",
    );
  });
});