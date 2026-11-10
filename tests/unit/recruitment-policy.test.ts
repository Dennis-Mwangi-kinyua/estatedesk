import test from "node:test";
import assert from "node:assert/strict";
import { allowedStages, applicationSchema, jobSchema, validateResume } from "../../apps/web/src/features/recruitment/policy";
test("public applications require informed consent and normalize candidate emails", () => {
  const input = { fullName: "A Candidate", email: "Candidate@Example.invalid", phone: "0700000000", coverLetter: "I have experience working with property management teams.", portfolioUrl: "", consent: "on" };
  assert.equal(applicationSchema.parse(input).email, "candidate@example.invalid");
  assert.equal(applicationSchema.safeParse({ ...input, consent: "" }).success, false);
  assert.equal(applicationSchema.safeParse({ ...input, portfolioUrl: "javascript:alert(1)" }).success, false);
});
test("job salary ranges and calendar dates must be consistent", () => {
  const job = { title: "Property manager", department: "Operations", location: "Nairobi, Kenya", employmentType: "FULL_TIME", workplace: "ON_SITE", description: "Manage a growing residential property portfolio.", requirements: "At least two years of relevant experience.", salaryMin: "10000", salaryMax: "20000", currencyCode: "KES", salaryPeriod: "MONTH", closingDate: "2028-02-29" };
  assert.equal(jobSchema.safeParse(job).success, true);
  assert.equal(jobSchema.safeParse({ ...job, salaryMax: "5000" }).success, false);
  assert.equal(jobSchema.safeParse({ ...job, salaryMin: "" }).success, false);
  assert.equal(jobSchema.safeParse({ ...job, closingDate: "2027-02-29" }).success, false);
});
test("CVs require bounded PDF bytes and applicant stages prevent accidental hiring", () => {
  assert.throws(() => validateResume(new Uint8Array([1, 2, 3])));
  assert.throws(() => validateResume(new Uint8Array(1024 * 1024 + 1)));
  assert.doesNotThrow(() => validateResume(new TextEncoder().encode("%PDF-1.4\n%%EOF")));
  assert.equal(allowedStages("SUBMITTED").includes("HIRED"), false);
  assert.equal(allowedStages("OFFERED").includes("HIRED"), true);
  assert.deepEqual(allowedStages("HIRED"), []);
  assert.deepEqual(allowedStages("WITHDRAWN"), []);
});
