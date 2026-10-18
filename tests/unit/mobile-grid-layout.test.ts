import test from "node:test";
import assert from "node:assert/strict";
import { cardGridLayout } from "../../apps/mobile/src/grid-layout";
test("phone content uses two columns and tablets expand the grid", () => {
  for (const width of [272, 300, 327, 342, 382, 500, 679]) assert.equal(cardGridLayout(width).columns, 2);
  assert.equal(cardGridLayout(680).columns, 3);
  assert.equal(cardGridLayout(960).columns, 4);
});
test("larger accessibility text and very narrow containers use one column", () => {
  assert.equal(cardGridLayout(252).columns, 1);
  for (const width of [272, 342, 680, 1000]) assert.equal(cardGridLayout(width, 1.5).columns, 1);
});
test("pixel rounding never makes a row overflow its measured container", () => {
  for (const width of [0, 252, 272.25, 327.5, 342, 679.8, 680, 959.9, 1000]) for (const scale of [1, 2, 3]) {
    const { columns, cellWidth } = cardGridLayout(width, 1, scale);
    assert.ok(cellWidth >= 0);
    assert.ok(columns * cellWidth + (columns - 1) * 12 <= width + 0.00001);
  }
});
