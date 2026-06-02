import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  DEFAULT_SITE_URL,
  SITE_NAME,
  absoluteUrl,
  getSiteUrl,
  publicPageMetadata,
} from "../../src/lib/seo";

function assertRobotsObject(
  value: ReturnType<typeof publicPageMetadata>["robots"],
): asserts value is Exclude<typeof value, string | undefined> {
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
    assertRobotsObject(metadata.robots);

    assert.equal(metadata.openGraph?.url, "https://app.example/water-billing-software");
    assert.equal(metadata.openGraph?.siteName, SITE_NAME);
    assert.equal(metadata.robots?.index, true);
    assert.equal(metadata.robots?.follow, true);
    assert.ok(metadata.keywords?.includes("meter reading software"));
  });
});
