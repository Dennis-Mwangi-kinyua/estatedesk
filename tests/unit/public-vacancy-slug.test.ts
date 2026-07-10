import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isLegacyVacancySlug,
  isRawDatabaseId,
  stripLegacyVacancySlug,
  vacancyPublicSlug,
} from "../../apps/web/src/lib/public-vacancy-slug";

describe("public vacancy slug", () => {
  it("builds human-readable slugs without database ids", () => {
    const slug = vacancyPublicSlug({
      propertyName: "Test Properties",
      houseNo: "A01",
    });

    assert.equal(slug, "test-properties-unit-a01");
    assert.doesNotMatch(slug, /--/);
    assert.doesNotMatch(slug, /^ed_/);
  });

  it("strips legacy suffixes and detects encoded tokens", () => {
    const base = vacancyPublicSlug({
      propertyName: "Test Properties",
      houseNo: "A01",
    });
    const legacy = `${base}--ed_exampletoken`;

    assert.equal(isLegacyVacancySlug(legacy), true);
    assert.equal(stripLegacyVacancySlug(legacy), base);
    assert.equal(stripLegacyVacancySlug(base), base);
  });

  it("flags raw database ids in public paths", () => {
    assert.equal(isRawDatabaseId("clh7k2x9f0000qz8e3abcd1234"), true);
    assert.equal(isRawDatabaseId("test-properties-unit-a01"), false);
  });
});