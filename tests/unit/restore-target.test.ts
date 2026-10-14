import assert from "node:assert/strict";
import { test } from "node:test";
import { validateRestoreTarget } from "../../scripts/validate-restore-target.mjs";

test("restore drill rejects production and pooled aliases even with different credentials", () => {
  assert.throws(() => validateRestoreTarget("postgres://other:secret@live.example/app", ["postgresql://user:secret@live-pooler.example:5432/app"]), /matches/);
  assert.doesNotThrow(() => validateRestoreTarget("postgres://user:secret@disposable.example/app", ["postgres://user:secret@live.example/app"]));
  assert.throws(() => validateRestoreTarget("https://example.com/app", []), /PostgreSQL/);
});
