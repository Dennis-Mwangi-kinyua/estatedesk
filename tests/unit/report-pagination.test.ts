import assert from "node:assert/strict";
import test from "node:test";
import { reportPage } from "../../apps/web/src/app/(app)/dashboard/org/reports/_lib/pagination";
test("report pagination bounds rendered rows while keeping global counts and deterministic ordering", () => {
  const rows = Array.from({ length: 620 }, (_, i) => ({ tenantId: String(i).padStart(4, "0"), tenantName: "Same name", amountDue: 100, balance: i % 2 ? 0 : 100 })).reverse();
  const first = reportPage(rows);
  assert.equal(first.totalRows, 620); assert.equal(first.paidCount, 310); assert.equal(first.pageRows.length, 25);
  assert.equal(first.pageRows[0].tenantId, "0000"); assert.equal(rows[0].tenantId, "0619");
  const last = reportPage(rows, "99999"); assert.equal(last.page, 25); assert.equal(last.pageRows.length, 20);
  for (const value of ["NaN", "-1", "1.5", "Infinity"]) assert.equal(reportPage(rows, value).page, 1);
  assert.equal(reportPage([]).pageCount, 1);
});
