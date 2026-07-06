import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getAllGuides,
  getGuideBySlug,
  getGuideHubPath,
  getGuidePath,
  getRelatedGuides,
  guideCategories,
  guidePublicIndexItems,
} from "../../src/lib/guides";
import { publicSiteIndexItems } from "../../src/lib/public-site-index";

describe("guides", () => {
  it("exposes a hub path and nine long-form articles", () => {
    assert.equal(getGuideHubPath(), "/guides");
    assert.equal(getAllGuides().length, 9);
    assert.ok(guideCategories.length >= 4);
  });

  it("resolves guides by slug and related guide links", () => {
    const rentGuide = getGuideBySlug("rent-tracking-workflow");

    assert.ok(rentGuide);
    assert.equal(getGuidePath(rentGuide.slug), "/guides/rent-tracking-workflow");
    assert.ok(rentGuide.sections.length >= 3);
    assert.ok(rentGuide.takeaways.length >= 3);
    assert.ok(rentGuide.faq.length >= 2);

    const related = getRelatedGuides(rentGuide.relatedGuideSlugs);
    assert.equal(related.length, rentGuide.relatedGuideSlugs.length);
    assert.ok(related.every((item) => item.slug !== rentGuide.slug));
  });

  it("publishes guide index items for sitemap and llms discovery", () => {
    assert.equal(guidePublicIndexItems[0]?.path, "/guides");
    assert.equal(guidePublicIndexItems.length, getAllGuides().length + 1);

    const publicPaths = publicSiteIndexItems.map((item) => item.path);
    assert.ok(publicPaths.includes("/guides"));
    assert.ok(publicPaths.includes("/guides/rent-tracking-workflow"));
    assert.ok(publicPaths.includes("/guides/kenya-rental-operations"));

    const rentGuide = publicSiteIndexItems.find(
      (item) => item.path === "/guides/rent-tracking-workflow",
    );
    assert.equal(rentGuide?.lastmod, "2026-05-12");
  });
});