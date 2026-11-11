import assert from "node:assert/strict";
import test from "node:test";
import { candidateMessage, applicationReference, stageMessageKinds } from "../../apps/web/src/features/recruitment/communication-policy";
import { applicationSchema } from "../../apps/web/src/features/recruitment/policy";

test("candidate templates use a stable reference and explicit interview timezone", () => {
  const base = { id: "candidate123", fullName: "Candidate", title: "Property manager", employer: "Example team" };
  assert.equal(applicationReference(base.id), "ED-CANDIDATE123");
  for (const kind of ["RECEIPT", ...Object.values(stageMessageKinds)]) {
    const message = candidateMessage({ ...base, kind, interviewAt: new Date("2026-12-10T07:00:00Z"), interviewDetails: "Meet online; contact hiring@example.invalid" });
    assert.ok(message.body.includes("ED-CANDIDATE123"));
    assert.ok(message.subject.includes(base.employer));
    if (kind === "INTERVIEW") { assert.match(message.body, /Africa\/Nairobi, UTC\+03:00/); assert.match(message.body, /hiring@example.invalid/); }
  }
});
test("application sources are a limited self-reported set with a legacy default", () => {
  const input = { fullName: "Candidate", email: "candidate@example.invalid", phone: "0700000000", coverLetter: "I have relevant property management experience and interest in this role.", portfolioUrl: "", consent: "on" };
  assert.equal(applicationSchema.parse(input).source, "UNSPECIFIED");
  assert.equal(applicationSchema.parse({ ...input, source: "REFERRAL" }).source, "REFERRAL");
  assert.equal(applicationSchema.safeParse({ ...input, source: "untrusted-referrer-url" }).success, false);
});
