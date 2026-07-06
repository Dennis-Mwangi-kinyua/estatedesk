import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  DEFAULT_SITE_URL,
  SITE_NAME,
  absoluteUrl,
  authPageMetadata,
  getSiteUrl,
  noIndexPageMetadata,
  publicPageMetadata,
} from "../../src/lib/seo";
import { marketCoverageItems } from "../../src/lib/seo-index";
import { publicSiteIndexItems } from "../../src/lib/public-site-index";

function assertRobotsObject(
  value: ReturnType<typeof publicPageMetadata>["robots"],
): asserts value is Exclude<typeof value, string | null | undefined> {
  assert.equal(typeof value, "object");
  assert.notEqual(value, null);
}

const originalAppUrl = process.env.APP_URL;
const originalPublicAppUrl = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  if (originalAppUrl === undefined) {
    delete process.env.APP_URL;
  } else {
    process.env.APP_URL = originalAppUrl;
  }

  if (originalPublicAppUrl === undefined) {
    delete process.env.NEXT_PUBLIC_APP_URL;
  } else {
    process.env.NEXT_PUBLIC_APP_URL = originalPublicAppUrl;
  }
});

describe("seo helpers", () => {
  it("normalizes site URLs and prefers the public app URL", () => {
    process.env.APP_URL = "https://internal.example/";
    process.env.NEXT_PUBLIC_APP_URL = "https://www.estatedesk.co.ke/";

    assert.equal(getSiteUrl(), DEFAULT_SITE_URL);
    assert.equal(absoluteUrl("pricing"), `${DEFAULT_SITE_URL}/pricing`);
  });

  it("creates indexable public page metadata with canonical and social data", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example";

    const metadata = publicPageMetadata({
      title: "Water Billing Software",
      description: "Manage water billing for rental properties.",
      path: "/water-billing-software",
      keywords: ["meter reading software"],
    });

    assert.deepEqual(metadata.title, {
      absolute: `Water Billing Software - ${SITE_NAME}`,
    });
    assert.equal(
      metadata.alternates?.canonical,
      "https://app.example/water-billing-software",
    );
    assert.deepEqual(metadata.alternates?.languages, {
      "en-KE": "https://app.example/water-billing-software",
      "x-default": "https://app.example/water-billing-software",
    });
    assertRobotsObject(metadata.robots);

    assert.equal(metadata.openGraph?.url, "https://app.example/water-billing-software");
    assert.equal(metadata.openGraph?.siteName, SITE_NAME);
    assert.equal(metadata.robots?.index, true);
    assert.equal(metadata.robots?.follow, true);
    assert.ok(metadata.keywords?.includes("meter reading software"));
  });

  it("creates noindex metadata for utility pages without blocking link discovery", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example";

    const metadata = noIndexPageMetadata({
      title: "Login",
      description: "Sign in to EstateDesk.",
      path: "/login",
    });

    assert.deepEqual(metadata.title, {
      absolute: `Login - ${SITE_NAME}`,
    });
    assert.equal(metadata.alternates?.canonical, "https://app.example/login");
    assertRobotsObject(metadata.robots);
    const robots = metadata.robots;
    assert.equal(robots.index, false);
    assert.equal(robots.follow, true);

    assertRobotsObject(robots.googleBot);
    assert.equal(robots.googleBot.index, false);
    assert.equal(robots.googleBot.follow, true);
  });

  it("indexes auth layout pages that do not require a session", () => {
    assertRobotsObject(authPageMetadata.robots);
    assert.equal(authPageMetadata.robots.index, true);
    assert.equal(authPageMetadata.robots.follow, true);

    assertRobotsObject(authPageMetadata.robots.googleBot);
    assert.equal(authPageMetadata.robots.googleBot.index, true);
    assert.equal(authPageMetadata.robots.googleBot.follow, true);
  });

  it("indexes every public no-login page in the manifest, including auth entry points", () => {
    const publicPaths = publicSiteIndexItems.map((item) => item.path);

    assert.ok(publicPaths.includes("/property-management-markets"));
    assert.ok(publicPaths.includes("/guides"));
    assert.ok(publicPaths.includes("/guides/water-billing-workflow"));
    assert.ok(marketCoverageItems.some((item) => item.href === "/guides"));
    assert.ok(publicPaths.includes("/terms"));
    assert.ok(publicPaths.includes("/login"));
    assert.ok(publicPaths.includes("/register"));
    assert.ok(publicPaths.includes("/forgot-password"));
    assert.ok(publicPaths.includes("/reset-password"));
    assert.ok(publicPaths.includes("/verify-email"));
    assert.ok(!publicPaths.some((path) => path.startsWith("/accept-invite")));
    assert.ok(!publicPaths.some((path) => path.startsWith("/dashboard")));
  });
});
