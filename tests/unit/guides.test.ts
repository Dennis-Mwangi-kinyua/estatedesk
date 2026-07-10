import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getAllGuides,
  getGuideBySlug,
  getGuideHubPath,
  getGuidePath,
  getPublicGuides,
  getRelatedGuides,
  guideCategories,
  guidePublicIndexItems,
  isPublicGuideArticle,
} from "../../apps/web/src/lib/guides";
import { publicSiteIndexItems } from "../../apps/web/src/lib/public-site-index";
import {
  canAccessGuideSlug,
  listGuideTopicsForWorkspace,
} from "../../apps/web/src/lib/help/in-app-guides";

describe("guides", () => {
  it("exposes a hub path and long-form articles", () => {
    assert.equal(getGuideHubPath(), "/guides");
    // Core public SEO guides + private workspace/platform help.
    assert.ok(getAllGuides().length >= 11);
    assert.ok(getPublicGuides().length >= 9);
    assert.ok(guideCategories.length >= 4);
  });

  it("keeps private workspace and platform guides off the public site", () => {
    const publicSlugs = new Set(getPublicGuides().map((g) => g.slug));

    for (const guide of getAllGuides()) {
      if (guide.privateInApp || guide.privatePlatform) {
        assert.equal(isPublicGuideArticle(guide), false);
        assert.equal(publicSlugs.has(guide.slug), false);
      }
    }

    assert.ok(getGuideBySlug("tenant-paying-your-bills")?.privateInApp);
    assert.ok(getGuideBySlug("org-verify-payments-guide")?.privateInApp);
    assert.ok(getGuideBySlug("platform-admin-handbook")?.privatePlatform);
    assert.equal(publicSlugs.has("tenant-paying-your-bills"), false);
    assert.equal(publicSlugs.has("platform-website-control"), false);
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

  it("publishes only public guide index items for sitemap and llms discovery", () => {
    assert.equal(guidePublicIndexItems[0]?.path, "/guides");
    assert.equal(guidePublicIndexItems.length, getPublicGuides().length + 1);

    const publicPaths = publicSiteIndexItems.map((item) => item.path);
    assert.ok(publicPaths.includes("/guides"));
    assert.ok(publicPaths.includes("/guides/rent-tracking-workflow"));
    assert.ok(publicPaths.includes("/guides/kenya-rental-operations"));
    assert.equal(publicPaths.includes("/guides/tenant-paying-your-bills"), false);
    assert.equal(publicPaths.includes("/guides/platform-admin-handbook"), false);

    const rentGuide = publicSiteIndexItems.find(
      (item) => item.path === "/guides/rent-tracking-workflow",
    );
    assert.equal(rentGuide?.lastmod, "2026-05-12");
  });

  it("scopes in-app help topics so roles cannot open each other's private guides", () => {
    assert.equal(
      canAccessGuideSlug("tenant-paying-your-bills", "tenant", "TENANT"),
      true,
    );
    assert.equal(
      canAccessGuideSlug("org-verify-payments-guide", "tenant", "TENANT"),
      false,
    );
    assert.equal(
      canAccessGuideSlug("platform-admin-handbook", "tenant", "TENANT"),
      false,
    );
    assert.equal(
      canAccessGuideSlug("tenant-paying-your-bills", "org", "ADMIN"),
      false,
    );
    assert.equal(
      canAccessGuideSlug("org-verify-payments-guide", "org", "ADMIN"),
      true,
    );
    assert.equal(
      canAccessGuideSlug("caretaker-submitting-meter-readings", "caretaker", "CARETAKER"),
      true,
    );
    assert.equal(
      canAccessGuideSlug("org-verify-payments-guide", "caretaker", "CARETAKER"),
      false,
    );
    assert.equal(
      canAccessGuideSlug("platform-admin-handbook", "platform"),
      true,
    );

    assert.equal(
      canAccessGuideSlug("tenant-paying-your-bills", "tenant", "TENANT"),
      true,
    );
    // Shared topic "rent" resolves to tenant-safe private bill guide, not org verification.
    assert.equal(
      canAccessGuideSlug("org-verify-payments-guide", "tenant", "TENANT"),
      false,
    );
  });
});
