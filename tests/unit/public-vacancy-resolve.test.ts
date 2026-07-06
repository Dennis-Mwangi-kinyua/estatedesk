import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveVacancyUnitIdFromSlugIndex } from "../../src/lib/public-vacancy-slug-index";
import { vacancyPublicSlug } from "../../src/lib/public-vacancy-slug";

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
});