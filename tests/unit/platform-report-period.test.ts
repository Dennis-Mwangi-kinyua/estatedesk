import test from "node:test";
import assert from "node:assert/strict";
import { reportPeriod, trend } from "../../apps/web/src/lib/reports/period";
import { reportCsv, reportExportRows, reportPdf } from "../../apps/web/src/lib/reports/export";
import { PDFDocument } from "pdf-lib";
const now = new Date("2026-10-22T12:00:00Z");
test("report dates use Nairobi boundaries and compare equal elapsed durations", () => {
  const today = reportPeriod({ reportPeriod: "today" }, now);
  assert.equal(today.current.gte.toISOString(), "2026-10-21T21:00:00.000Z");
  assert.equal(today.previous.gte.toISOString(), "2026-10-20T21:00:00.000Z");
  assert.equal(today.previous.lt.toISOString(), "2026-10-21T12:00:00.000Z");
  assert.equal(today.current.lt.getTime() - today.current.gte.getTime(), today.previous.lt.getTime() - today.previous.gte.getTime());
  const last = reportPeriod({ reportPeriod: "lastMonth" }, now);
  assert.deepEqual([last.from, last.to], ["2026-09-01", "2026-09-30"]);
  const leap = reportPeriod({ reportPeriod: "custom", from: "2024-02-29", to: "2024-02-29" }, now);
  assert.equal(leap.current.lt.getTime() - leap.current.gte.getTime(), 86400000);
  for (const [from, to] of [["2026-02-30", "2026-03-01"], ["2026-10-23", "2026-10-24"], ["2026-10-22", "2026-10-21"], ["2024-01-01", "2026-01-01"]]) assert.throws(() => reportPeriod({ reportPeriod: "custom", from, to }, now));
  assert.throws(() => reportPeriod({ reportPeriod: "custom" }, now));
});
test("trends avoid fabricated percentages with zero previous activity", () => {
  assert.equal(trend(0, 0), "No change (0 to 0)"); assert.match(trend(4, 0), /no previous activity/); assert.match(trend(5, 10), /-50.0%/);
});
test("CSV neutralizes formulas, quotes and multiline names; PDF paginates exported rows", async () => {
  const csv = reportCsv([["=HYPERLINK(\"bad\")", " +SUM(1)", "Org, \"One\"\nNairobi"]]);
  assert.match(csv, /'=HYPERLINK/); assert.match(csv, /' \+SUM/); assert.match(csv, /"Org, ""One""\nNairobi"/);
  const bytes = await reportPdf(Array.from({ length: 150 }, (_, index) => [`Organization ${index}`, "Current 40", "Previous 20"]));
  assert.equal(Buffer.from(bytes).subarray(0, 5).toString(), "%PDF-"); assert.ok((await PDFDocument.load(bytes)).getPageCount() > 1);
  assert.equal(typeof reportExportRows, "function");
});
