import assert from "node:assert/strict";
import { test } from "node:test";
import { rentalInventorySitemapEntries, rentalCategoryType } from "../../apps/web/src/lib/seo/rental-inventory";

test("rental sitemap uses published inventory dates, canonical locations, and latest updates", () => {
  const unit = (location: string, date: string, type = "APARTMENT") => ({ type, updatedAt: new Date(date), property: { location, address: null, name: "Test" } });
  const entries = rentalInventorySitemapEntries([unit("Westlands Nairobi", "2026-09-01"), unit("Westlands", "2026-09-12"), unit("Unknown Estate", "2026-10-01"), unit("Ruiru Town", "2026-08-01", "BEDSITTER")]);
  assert.deepEqual([...entries], [["/vacancies/westlands", "2026-09-12"], ["/vacancies/westlands/apartments", "2026-09-12"], ["/vacancies/ruiru", "2026-08-01"], ["/vacancies/ruiru/bedsitters", "2026-08-01"]]);
  assert.equal(rentalInventorySitemapEntries([]).size, 0);
});

test("unsupported rental categories do not become indexable type filters", () => {
  assert.equal(rentalCategoryType("apartments"), "APARTMENT");
  assert.equal(rentalCategoryType("constructor"), undefined);
  assert.equal(rentalCategoryType("unknown"), undefined);
});
