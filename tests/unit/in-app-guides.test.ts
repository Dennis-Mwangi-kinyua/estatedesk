import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getGuideBySlug } from "../../src/lib/guides";
import { getInAppHelpArticlePath, getInAppHelpHubPath } from "../../src/lib/help/help-workspace";
import {
  canAccessGuideSlug,
  canAccessGuideTopic,
  getInAppGuideTopic,
  inAppGuideTopics,
  listGuideTopicsForWorkspace,
} from "../../src/lib/help/in-app-guides";

describe("in-app guides", () => {
  it("maps every in-app topic to a published guide article", () => {
    for (const topic of Object.keys(inAppGuideTopics) as Array<
      keyof typeof inAppGuideTopics
    >) {
      const mapping = getInAppGuideTopic(topic);
      const guide = getGuideBySlug(mapping.slug);

      assert.ok(guide, `missing guide for topic ${topic}`);
      assert.equal(
        getInAppHelpArticlePath("org", mapping.slug),
        `/dashboard/org/help/${mapping.slug}`,
      );
      assert.ok(mapping.label.length > 0);
    }
  });

  it("scopes help hubs to protected dashboard workspaces", () => {
    assert.equal(getInAppHelpHubPath("org"), "/dashboard/org/help");
    assert.equal(getInAppHelpHubPath("tenant"), "/dashboard/tenant/help");
    assert.equal(getInAppHelpHubPath("caretaker"), "/dashboard/caretaker/help");
    assert.equal(getInAppHelpHubPath("landlord"), "/dashboard/landlord/help");
    assert.equal(getInAppHelpHubPath("platform"), "/platform/help");
  });

  it("filters org topics by organization role", () => {
    assert.equal(canAccessGuideTopic("vacancies", "org", "OFFICE"), true);
    assert.equal(canAccessGuideTopic("vacancies", "org", "ACCOUNTANT"), false);
    assert.equal(canAccessGuideTopic("rent", "org", "ACCOUNTANT"), true);
    assert.equal(canAccessGuideTopic("caretaker", "org", "ADMIN"), false);
  });

  it("exposes every guide topic to the platform workspace", () => {
    assert.deepEqual(
      listGuideTopicsForWorkspace("platform"),
      Object.keys(inAppGuideTopics),
    );
  });

  it("keeps tenant and caretaker topics inside their workspaces", () => {
    assert.deepEqual(listGuideTopicsForWorkspace("tenant", "TENANT"), [
      "issues",
      "water",
      "rent",
      "moveOut",
    ]);
    assert.deepEqual(listGuideTopicsForWorkspace("caretaker", "CARETAKER"), [
      "issues",
      "water",
      "caretaker",
      "moveOut",
    ]);
    assert.equal(canAccessGuideSlug("vacancy-marketing-guide", "tenant", "TENANT"), false);
    assert.equal(canAccessGuideTopic("apiIntegrations", "org", "ADMIN"), true);
    assert.equal(canAccessGuideTopic("apiIntegrations", "org", "MANAGER"), false);
  });
});