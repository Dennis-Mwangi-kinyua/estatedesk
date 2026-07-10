import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TicketPriority, TicketStatus } from "@prisma/client";
import {
  buildHandoverPrefill,
  buildHandoverPrefillByLocale,
} from "../../apps/web/src/app/(app)/dashboard/caretaker/handover/_lib/handover-prefill";

const sampleIssues = [
  {
    title: "Leaking sink",
    priority: TicketPriority.URGENT,
    status: TicketStatus.OPEN,
    unit: {
      houseNo: "12B",
      property: { name: "Sunrise Court" },
    },
  },
];

describe("caretaker handover prefill", () => {
  it("builds English and Swahili templates", () => {
    const templates = buildHandoverPrefillByLocale(sampleIssues, 1);

    assert.match(templates.en, /Shift summary:/);
    assert.match(templates.en, /Leaking sink/);
    assert.match(templates.sw, /Muhtasari wa zamu:/);
    assert.match(templates.sw, /Leaking sink/);
  });

  it("returns an empty-shift template when there are no open issues", () => {
    const empty = buildHandoverPrefill({
      locale: "en",
      openIssues: [],
      urgentCount: 0,
    });

    assert.match(empty, /No open issues/);
  });
});