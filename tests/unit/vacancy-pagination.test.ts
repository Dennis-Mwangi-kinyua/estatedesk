import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildVacancyPageHref,
  buildVacancyPagination,
  paginateItems,
  parsePositiveInt,
} from "../../apps/web/src/lib/vacancy-pagination";

describe("vacancy pagination helpers", () => {
  it("parses positive integers with a fallback", () => {
    assert.equal(parsePositiveInt("3"), 3);
    assert.equal(parsePositiveInt("0"), 1);
    assert.equal(parsePositiveInt("-2"), 1);
    assert.equal(parsePositiveInt(undefined, 2), 2);
    assert.equal(parsePositiveInt("abc", 4), 4);
  });

  it("clamps page numbers to the available page count", () => {
    const pagination = buildVacancyPagination(25, 99, 12);

    assert.equal(pagination.pageCount, 3);
    assert.equal(pagination.currentPage, 3);
    assert.equal(pagination.start, 24);
    assert.equal(pagination.end, 25);
  });

  it("slices items for the requested page", () => {
    const items = Array.from({ length: 14 }, (_, index) => `item-${index + 1}`);
    const { items: visibleItems, pagination } = paginateItems(items, 2, 6);

    assert.deepEqual(visibleItems, ["item-7", "item-8", "item-9", "item-10", "item-11", "item-12"]);
    assert.equal(pagination.currentPage, 2);
    assert.equal(pagination.pageCount, 3);
  });

  it("builds crawlable page hrefs while preserving filters", () => {
    assert.equal(buildVacancyPageHref("/vacancies", 1, { q: "studio", location: "ruiru" }), "/vacancies?q=studio&location=ruiru");
    assert.equal(
      buildVacancyPageHref("/vacancies", 2, { q: "studio", location: "ruiru" }),
      "/vacancies?q=studio&location=ruiru&page=2",
    );
    assert.equal(
      buildVacancyPageHref("/vacancies/greenview--token", 3, {}, "relatedPage"),
      "/vacancies/greenview--token?relatedPage=3",
    );
  });
});