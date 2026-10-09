import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canInspectUnit } from "../../apps/web/src/lib/move-outs/inspection-scope";
import { nairobiDate, parseCloseout, parseInspectionDate, parseMoveOutDate } from "../../apps/web/src/lib/move-outs/validation";

const now = new Date("2026-10-09T12:00:00Z");
function closeout(overrides: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ actualMoveOutDate: "2026-10-09", depositHeld: "12000.50", deductions: "500.25", refundStatus: "PENDING", notes: "Rent and water reviewed; deductions agreed for repairs.", keysReturned: "on", balancesReviewed: "on", ...overrides })) form.set(key, value);
  return form;
}
describe("move-out workflow", () => {
  it("treats notice dates and inspection times consistently in Nairobi", () => {
    assert.equal(nairobiDate(new Date("2026-10-08T22:00:00Z")), "2026-10-09");
    assert.equal(parseMoveOutDate("2026-10-09").toISOString(), "2026-10-08T21:00:00.000Z");
    assert.equal(parseInspectionDate("2026-10-09T16:30", now).toISOString(), "2026-10-09T13:30:00.000Z");
    assert.equal(parseInspectionDate("2026-10-09T11:59", now).toISOString(), "2026-10-09T08:59:00.000Z");
    assert.throws(() => parseMoveOutDate("2026-02-30"));
    assert.throws(() => parseMoveOutDate("2026-10-09T10:00"));
    assert.throws(() => parseInspectionDate("2026-10-08T23:59", now), /past date/);
    assert.throws(() => parseInspectionDate("2026-10-09T25:00", now));
  });
  it("permits active staff of different roles only within their unit scope", () => {
    const unit = { id: "unit-a", propertyId: "property-a", buildingId: "building-a" };
    for (const role of ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER", "LANDLORD"]) assert.equal(canInspectUnit([{ role, scopeType: "ORG", scopeId: "ORG_SCOPE" }], unit), true);
    for (const [scopeType, scopeId] of [["PROPERTY", "property-a"], ["BUILDING", "building-a"], ["UNIT", "unit-a"]]) assert.equal(canInspectUnit([{ role: "OFFICE", scopeType, scopeId }], unit), true);
    assert.equal(canInspectUnit([{ role: "OFFICE", scopeType: "PROPERTY", scopeId: "other-property" }], unit), false);
    assert.equal(canInspectUnit([{ role: "TENANT", scopeType: "ORG", scopeId: "ORG_SCOPE" }], unit), false);
    assert.equal(canInspectUnit([{ role: "OFFICE", scopeType: "ORG", scopeId: "ORG_SCOPE", employmentEndedAt: now }], unit), false);
    assert.equal(canInspectUnit([{ role: "MANAGER", scopeType: "ORG", scopeId: "ORG_SCOPE", deactivatedAt: now }], unit), false);
    assert.equal(canInspectUnit([], unit), false);
  });
  it("records exact deposit amounts and requires a completed handover review", () => {
    const value = parseCloseout(closeout(), now);
    assert.equal(value.settlement.refundDue, 11500.25);
    for (const input of ([{ keysReturned: "" }, { balancesReviewed: "" }, { notes: "" }, { actualMoveOutDate: "2026-10-10" }, { deductions: "13000" }, { depositHeld: "-1" }, { deductions: "0.001" }, { refundStatus: "NOT_DUE" }] as Record<string, string>[])) assert.throws(() => parseCloseout(closeout(input), now));
    assert.equal(parseCloseout(closeout({ depositHeld: "0", deductions: "0", refundStatus: "NOT_DUE" }), now).settlement.refundDue, 0);
    assert.throws(() => parseCloseout(closeout({ depositHeld: "0", deductions: "0", refundStatus: "PENDING" }), now));
  });
});
