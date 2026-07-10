import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TicketPriority, TicketStatus } from "@prisma/client";
import { getIssueSlaState } from "../../apps/web/src/lib/issues/sla";

describe("caretaker issue SLA", () => {
  it("returns overdue state after the SLA window passes", () => {
    const createdAt = new Date("2026-07-06T08:00:00.000Z");
    const now = new Date("2026-07-06T13:30:00.000Z");

    const sla = getIssueSlaState({
      createdAt,
      priority: TicketPriority.URGENT,
      status: TicketStatus.OPEN,
      now,
    });

    assert.equal(sla?.tone, "overdue");
    assert.match(sla?.label ?? "", /overdue/);
  });

  it("returns warning state near the deadline", () => {
    const createdAt = new Date("2026-07-06T08:00:00.000Z");
    const now = new Date("2026-07-06T11:30:00.000Z");

    const sla = getIssueSlaState({
      createdAt,
      priority: TicketPriority.URGENT,
      status: TicketStatus.IN_PROGRESS,
      now,
    });

    assert.equal(sla?.tone, "warning");
    assert.match(sla?.label ?? "", /left/);
  });

  it("hides SLA badges for closed issues", () => {
    const sla = getIssueSlaState({
      createdAt: new Date("2026-07-06T08:00:00.000Z"),
      priority: TicketPriority.HIGH,
      status: TicketStatus.RESOLVED,
    });

    assert.equal(sla, null);
  });
});