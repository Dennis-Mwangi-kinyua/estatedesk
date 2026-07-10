import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  previousCalendarMonthRange,
  shouldSendOwnerStatementsToday,
} from "../../apps/web/src/lib/accounting/owner-statement-policy";

describe("owner statement schedule", () => {
  it("returns the previous calendar month range", () => {
    const range = previousCalendarMonthRange(new Date("2026-03-15T00:00:00.000Z"));
    assert.equal(range.startsAt.toISOString().slice(0, 10), "2026-02-01");
    assert.equal(range.endsAt.toISOString().slice(0, 10), "2026-02-28");
    assert.match(range.label, /February 2026/);
  });

  it("sends only on the configured day once per month", () => {
    assert.equal(
      shouldSendOwnerStatementsToday(
        {
          ownerStatementEmailEnabled: true,
          ownerStatementEmailDayOfMonth: 5,
          ownerStatementLastSentAt: null,
        },
        new Date("2026-03-05T12:00:00.000Z"),
      ),
      true,
    );

    assert.equal(
      shouldSendOwnerStatementsToday(
        {
          ownerStatementEmailEnabled: true,
          ownerStatementEmailDayOfMonth: 5,
          ownerStatementLastSentAt: new Date("2026-03-05T08:00:00.000Z"),
        },
        new Date("2026-03-05T12:00:00.000Z"),
      ),
      false,
    );

    assert.equal(
      shouldSendOwnerStatementsToday(
        {
          ownerStatementEmailEnabled: false,
          ownerStatementEmailDayOfMonth: 5,
          ownerStatementLastSentAt: null,
        },
        new Date("2026-03-05T12:00:00.000Z"),
      ),
      false,
    );
  });
});