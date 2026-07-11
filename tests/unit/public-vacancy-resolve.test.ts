import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveVacancyUnitIdFromSlugIndex } from "../../apps/web/src/lib/public-vacancy-slug-index";
import { vacancyPublicSlug } from "../../apps/web/src/lib/public-vacancy-slug";

describe("public vacancy resolve", () => {
  it("resolves a unit id from the full slug index", () => {
    const slug = vacancyPublicSlug({
      propertyName: "Greenview Apartments",
      houseNo: "B12",
    });
    const unitId = resolveVacancyUnitIdFromSlugIndex(slug, [
      {
        id: "unit-1",
        propertyName: "Other Property",
        houseNo: "A01",
      },
      {
        id: "unit-2",
        propertyName: "Greenview Apartments",
        houseNo: "B12",
      },
    ]);

    assert.equal(unitId, "unit-2");
  });

  it("returns null when the slug is not in the index", () => {
    const slug = vacancyPublicSlug({
      propertyName: "Missing Property",
      houseNo: "Z99",
    });
    const unitId = resolveVacancyUnitIdFromSlugIndex(slug, [
      {
        id: "unit-1",
        propertyName: "Greenview Apartments",
        houseNo: "B12",
      },
    ]);

    assert.equal(unitId, null);
  });

  it("resolves units that are outside the public listings page limit", () => {
    const slug = vacancyPublicSlug({
      propertyName: "Faraway Estate",
      houseNo: "301",
    });
    const index = Array.from({ length: 300 }, (_, index) => ({
      id: `unit-${index}`,
      propertyName: `Property ${index}`,
      houseNo: String(index),
    }));
    index.push({
      id: "unit-faraway",
      propertyName: "Faraway Estate",
      houseNo: "301",
    });

    const unitId = resolveVacancyUnitIdFromSlugIndex(slug, index);

    assert.equal(unitId, "unit-faraway");
  });

  it("returns null for ambiguous base-slug collisions", () => {
    const slug = vacancyPublicSlug({
      propertyName: "Sunrise Apartments",
      houseNo: "A1",
    });
    const unitId = resolveVacancyUnitIdFromSlugIndex(slug, [
      {
        id: "unit-a",
        propertyName: "Sunrise Apartments",
        houseNo: "A1",
      },
      {
        id: "unit-b",
        propertyName: "Sunrise Apartments",
        houseNo: "A1",
      },
    ]);

    assert.equal(unitId, null);
  });

  it("prefers exact stored publicSlug matches", () => {
    const unitId = resolveVacancyUnitIdFromSlugIndex("sunrise-apartments-unit-a1-abc123", [
      {
        id: "unit-a",
        propertyName: "Sunrise Apartments",
        houseNo: "A1",
        publicSlug: "sunrise-apartments-unit-a1-abc123",
      },
      {
        id: "unit-b",
        propertyName: "Sunrise Apartments",
        houseNo: "A1",
        publicSlug: "sunrise-apartments-unit-a1-def456",
      },
    ]);

    assert.equal(unitId, "unit-a");
  });
});
