import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getAuditActivityHref } from "../../apps/web/src/app/(app)/dashboard/org/_lib/activity-links";

describe("getAuditActivityHref", () => {
  it("maps known entity types to org desk routes", () => {
    assert.equal(
      getAuditActivityHref("VacancyInquiry", "inq_1"),
      "/dashboard/org/vacancy-inquiries",
    );
    assert.equal(
      getAuditActivityHref("MoveOutNotice", "notice_1"),
      "/dashboard/org/move-outs",
    );
    assert.equal(
      getAuditActivityHref("IssueResolutionReport", "report_1"),
      "/dashboard/org/issues/resolution-reports",
    );
    assert.equal(
      getAuditActivityHref("IssueTicket", "issue_1"),
      "/dashboard/org/issues/issue_1",
    );
  });

  it("returns null for unsupported entity types", () => {
    assert.equal(getAuditActivityHref("UnknownEntity", "id_1"), null);
  });
});