import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getLandingContentDepth } from "../../apps/web/src/lib/content-depth/landing-depth";
import {
  trustContentDepth,
  vacancyContentDepth,
} from "../../apps/web/src/lib/content-depth/marketing-depth";
import { siteContentDepth } from "../../apps/web/src/lib/content-depth/site-topics";

describe("content depth", () => {
  it("provides shared site-wide depth sections", () => {
    assert.ok((siteContentDepth.scenarios?.length ?? 0) >= 4);
    assert.ok((siteContentDepth.problems?.length ?? 0) >= 4);
    assert.ok((siteContentDepth.guides?.length ?? 0) >= 4);
    assert.ok((siteContentDepth.editorial?.length ?? 0) >= 2);
  });

  it("adds page-specific depth for major SEO landing pages", () => {
    const kenya = getLandingContentDepth("/property-management-software-kenya");
    const rent = getLandingContentDepth("/rent-tracking-software");

    assert.ok(kenya?.scenarios?.length);
    assert.ok(kenya?.problems?.length);
    assert.ok(kenya?.editorial?.length);
    assert.match(kenya.editorial?.join(" ") ?? "", /Kenya/i);

    assert.ok(rent?.scenarios?.length);
    assert.match(rent.problems?.[0]?.problem ?? "", /spreadsheet|Excel|records/i);
    assert.match(
      kenya.guides?.[0]?.href ?? "",
      /\/guides\/kenya-rental-operations$/,
    );
  });

  it("provides content depth for vacancies and trust pages", () => {
    assert.ok((vacancyContentDepth.scenarios?.length ?? 0) >= 3);
    assert.ok((vacancyContentDepth.guides?.length ?? 0) >= 3);
    assert.ok((trustContentDepth.guides?.length ?? 0) >= 3);
    assert.ok((trustContentDepth.editorial?.length ?? 0) >= 2);
  });
});