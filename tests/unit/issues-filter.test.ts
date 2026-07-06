import assert from "node:assert/strict";
import { TicketStatus } from "@prisma/client";
import { describe, it } from "node:test";
import { buildIssueFilterWhere } from "../../src/app/(app)/dashboard/org/issues/_lib/helpers";

describe("buildIssueFilterWhere", () => {
  const orgId = "org_test_123";

  it("scopes every filter to the organization", () => {
    const filters = ["all", "new", "progress", "resolved", "cancelled"] as const;

    for (const filter of filters) {
      const where = buildIssueFilterWhere(orgId, filter);
      assert.equal(where.orgId, orgId);
    }
  });

  it("treats new issues as open and unassigned", () => {
    const where = buildIssueFilterWhere(orgId, "new");

    assert.equal(where.status, TicketStatus.OPEN);
    assert.equal(where.assignedToUserId, null);
  });

  it("maps progress issues to in-progress status", () => {
    const where = buildIssueFilterWhere(orgId, "progress");
    assert.equal(where.status, TicketStatus.IN_PROGRESS);
  });

  it("maps resolved issues to resolved and closed statuses", () => {
    const where = buildIssueFilterWhere(orgId, "resolved");

    assert.deepEqual(where.status, {
      in: [TicketStatus.RESOLVED, TicketStatus.CLOSED],
    });
  });

  it("maps cancelled issues to cancelled status", () => {
    const where = buildIssueFilterWhere(orgId, "cancelled");
    assert.equal(where.status, TicketStatus.CANCELLED);
  });
});