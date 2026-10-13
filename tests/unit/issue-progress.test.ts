import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getIssueProgress } from "../../apps/web/src/lib/issues/progress";

const at = new Date("2026-10-13T06:00:00Z");
const base = { status: "OPEN" as const, createdAt: at, resolvedAt: null, assignedTo: null, resolutionReports: [] };
const assignee = { fullName: "Assigned Caretaker", email: "caretaker@example.test" };
const submitted = { status: "SUBMITTED" as const, submittedAt: at, officeReviewedAt: null, tenantConfirmedAt: null };

describe("issue progress milestones", () => {
  it("waits for allocation on a new issue and shows the allocated person when work starts", () => {
    assert.equal(getIssueProgress(base).currentIndex, 1);
    const progress = getIssueProgress({ ...base, status: "IN_PROGRESS", assignedTo: assignee });
    assert.equal(progress.currentIndex, 2);
    assert.equal(progress.steps[1].caption, assignee.fullName);
    assert.equal(progress.steps[2].complete, false);
  });
  it("distinguishes submitted work from office approval and tenant confirmation", () => {
    const pending = getIssueProgress({ ...base, status: "IN_PROGRESS", assignedTo: assignee, resolutionReports: [submitted] });
    assert.equal(pending.currentIndex, 4);
    assert.equal(pending.steps[3].complete, true);
    assert.equal(pending.steps[4].complete, false);
    const approved = getIssueProgress({ ...base, status: "RESOLVED", resolutionReports: [{ ...submitted, status: "OFFICE_APPROVED", officeReviewedAt: at }] });
    assert.equal(approved.currentIndex, 5);
    assert.equal(approved.steps[4].complete, true);
    assert.equal(approved.steps[5].complete, false);
    const confirmed = getIssueProgress({ ...base, status: "CLOSED", resolutionReports: [{ ...submitted, status: "TENANT_CONFIRMED", officeReviewedAt: at, tenantConfirmedAt: at }] });
    assert.equal(confirmed.currentIndex, -1);
    assert.equal(confirmed.steps[5].caption, "Tenant confirmed completion");
  });
  it("returns rejected reports to further work and does not mark office approval complete", () => {
    const result = getIssueProgress({ ...base, status: "IN_PROGRESS", resolutionReports: [{ ...submitted, status: "REJECTED", officeReviewedAt: at }] });
    assert.equal(result.currentIndex, 2);
    assert.equal(result.steps[2].complete, false);
    assert.equal(result.steps[3].complete, false);
    assert.equal(result.steps[4].complete, false);
  });
  it("does not claim tenant confirmation when a legacy issue was simply closed", () => {
    const result = getIssueProgress({ ...base, status: "CLOSED", resolvedAt: at });
    assert.equal(result.steps[5].caption, "Issue closed");
    assert.equal(result.steps[4].complete, false);
  });
  it("stops tracking cancelled issues and resets report milestones when reopened", () => {
    assert.equal(getIssueProgress({ ...base, status: "CANCELLED" }).currentIndex, -1);
    assert.equal(getIssueProgress({ ...base, status: "CANCELLED" }).cancelled, true);
    const reopened = getIssueProgress({ ...base, resolutionReports: [{ ...submitted, status: "TENANT_CONFIRMED" }] });
    assert.equal(reopened.steps[3].complete, false);
    assert.equal(reopened.steps[5].complete, false);
  });
});
