import test from "node:test";
import assert from "node:assert/strict";
import { vacancyRecordDate } from "../../apps/web/src/lib/vacancy-record-date";

test("listing update labels accept serialized cache dates and use Nairobi dates", () => {
  const iso = "2026-10-22T22:00:00.000Z";
  const expected = new Date(iso).toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi", year: "numeric", month: "short", day: "numeric" });
  assert.equal(vacancyRecordDate(iso), expected);
  assert.equal(vacancyRecordDate(new Date(iso)), expected);
  for (const value of [null, undefined, "", "unknown", new Date(NaN)]) assert.equal(vacancyRecordDate(value), null);
});
