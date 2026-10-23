import assert from "node:assert/strict";
import test from "node:test";
import { getPagination } from "../../apps/web/src/lib/db/pagination";

test("pagination normalizes malformed query numbers to valid Prisma integers", () => {
  assert.deepEqual(getPagination({ page: NaN, pageSize: NaN }), { page: 1, pageSize: 20, skip: 0, take: 20 });
  assert.deepEqual(getPagination({ page: 2.9, pageSize: 12.7 }), { page: 2, pageSize: 12, skip: 12, take: 12 });
  for (const page of [Infinity, -Infinity, -100, 0, Number.MAX_VALUE]) {
    for (const pageSize of [Infinity, NaN, -1, 0, 10.5, Number.MAX_VALUE]) {
      const result = getPagination({ page, pageSize });
      assert.ok(Number.isInteger(result.page) && result.page >= 1);
      assert.ok(Number.isInteger(result.take) && result.take >= 1 && result.take <= 100);
      assert.ok(Number.isInteger(result.skip) && result.skip >= 0 && result.skip <= 2_147_483_647);
    }
  }
});
