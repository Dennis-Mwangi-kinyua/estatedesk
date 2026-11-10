import { test } from "node:test";
import assert from "node:assert/strict";
import { trialFollowUps, TRIAL_DAYS } from "../../apps/web/src/lib/sales/demo-policy";

test("trial follow-ups use the activation date and include an advance expiry reminder", () => {
  const start = new Date("2026-11-10T08:30:00Z");
  const tasks = trialFollowUps(start);
  assert.deepEqual(tasks.map(t => t.dueAt.toISOString()), [
    "2026-11-13T08:30:00.000Z", "2026-11-17T08:30:00.000Z",
    "2026-11-22T08:30:00.000Z", "2026-11-24T08:30:00.000Z",
  ]);
  assert.equal(TRIAL_DAYS, 14);
  assert.equal(start.toISOString(), "2026-11-10T08:30:00.000Z");
  assert.match(tasks[2].body, /ends in two days/);
  assert.match(tasks[3].body, /grace period is separate/);
});
