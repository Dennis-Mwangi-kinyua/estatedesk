import assert from "node:assert/strict";
import { test } from "node:test";
import { vacancyListOrderBy } from "../../services/public-vacancy/src/where";

test("default discovery uses the persisted random position with an unambiguous pagination tie-breaker", () => {
  assert.deepEqual(vacancyListOrderBy(), [{ publicListingRank: "asc" }, { id: "asc" }]);
  assert.deepEqual(vacancyListOrderBy("random"), vacancyListOrderBy());
  for (const sort of ["rent_asc", "rent_desc", "newest", "location"] as const) {
    const order = vacancyListOrderBy(sort);
    assert.deepEqual(order.at(-1), { id: "asc" });
    assert.ok(!order.some(field => "publicListingRank" in field));
  }
});
