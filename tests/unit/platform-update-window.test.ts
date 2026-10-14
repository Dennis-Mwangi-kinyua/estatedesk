import assert from "node:assert/strict";
import test from "node:test";
import { parseUpdateWindow, formatUpdateTime } from "../../apps/web/src/features/platform-updates/policy";

test("scheduled updates interpret the entered time in EAT regardless of server timezone", () => {
  const window = parseUpdateWindow("2026-10-15T22:30", "45", new Date("2026-10-14T00:00:00Z"));
  assert.equal(window.startsAt.toISOString(), "2026-10-15T19:30:00.000Z");
  assert.equal(window.endsAt.toISOString(), "2026-10-15T20:15:00.000Z");
  assert.match(formatUpdateTime(window.startsAt), /22:30 EAT$/);
});
test("invalid dates, past times and invalid durations cannot be announced", () => {
  const now = new Date("2026-10-14T00:00:00Z");
  for (const date of ["2026-02-30T20:00", "2026-10-13T20:00", "tomorrow", "2026-13-01T20:00"]) assert.throws(() => parseUpdateWindow(date, "30", now));
  for (const duration of ["", "0", "-1", "1.5", "1441", "invalid"]) assert.throws(() => parseUpdateWindow("2026-10-15T20:00", duration, now));
});
