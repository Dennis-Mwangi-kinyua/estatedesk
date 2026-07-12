import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getGuideBySlug } from "../../apps/web/src/lib/guides";
import { getInAppHelpArticlePath, getInAppHelpHubPath } from "../../apps/web/src/lib/help/help-workspace";
import {
  canAccessGuideSlug,
  canAccessGuideTopic,
  getInAppGuideTopic,
  inAppGuideTopics,
  listGuideTopicsForWorkspace,
} from "../../apps/web/src/lib/help/in-app-guides";

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

  it("exposes platform-scoped guide topics to the platform workspace", () => {
    const topics = listGuideTopicsForWorkspace("platform");
    assert.ok(topics.includes("platformControl"));
    assert.ok(topics.includes("platformAdminOps"));
    assert.ok(topics.includes("platformAdminHandbook"));
    assert.ok(topics.includes("platformSupportPlaybook"));
    // Platform list is only topics with workspaces: ["platform"] (no org/tenant mix-ins).
    for (const topic of topics) {
      assert.ok(topic.startsWith("platform"));
    }
  });

  it("keeps tenant and caretaker topics inside their workspaces", () => {
    const tenantTopics = listGuideTopicsForWorkspace("tenant", "TENANT");
    assert.ok(tenantTopics.includes("issues"));
    assert.ok(tenantTopics.includes("water"));
    assert.ok(tenantTopics.includes("rent"));
    assert.ok(tenantTopics.includes("moveOut"));
    assert.ok(tenantTopics.includes("tenantOverview"));
    assert.ok(tenantTopics.includes("tenantPay"));
    assert.ok(!tenantTopics.includes("apiIntegrations"));
    assert.ok(!tenantTopics.includes("platformControl"));

    const caretakerTopics = listGuideTopicsForWorkspace("caretaker", "CARETAKER");
    assert.ok(caretakerTopics.includes("issues"));
    assert.ok(caretakerTopics.includes("water"));
    assert.ok(caretakerTopics.includes("caretaker"));
    assert.ok(caretakerTopics.includes("moveOut"));
    assert.ok(!caretakerTopics.includes("platformControl"));

    assert.equal(canAccessGuideSlug("vacancy-marketing-guide", "tenant", "TENANT"), false);
    assert.equal(canAccessGuideTopic("apiIntegrations", "org", "ADMIN"), true);
    assert.equal(canAccessGuideTopic("apiIntegrations", "org", "MANAGER"), false);
  });
});