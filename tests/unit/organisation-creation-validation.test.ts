import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isValidTimezone, isValidPhone, normalizePhone, validateAccountStep } from "../../apps/web/src/app/(app)/platform/organizations/new/_lib/form-validation";

describe("organisation creation validation", () => {
  it("rejects unknown timezones and accepts supported zones", () => {
    assert.equal(isValidTimezone("Africa/Nairobi"), true);
    assert.equal(isValidTimezone("Mars/City"), false);
    assert.equal(isValidTimezone(""), false);
  });
  it("normalizes international phones while rejecting ambiguous local numbers", () => {
    assert.equal(normalizePhone("+254 (700) 000-000"), "+254700000000");
    assert.equal(isValidPhone("+254 (700) 000-000"), true);
    assert.equal(isValidPhone("0700000000"), false);
    assert.equal(isValidPhone(""), true);
    assert.equal(isValidPhone("+000000000"), false);
  });
  it("catches a name which cannot generate a workspace address", () => {
    const errors = validateAccountStep(1, { organizationName: "!!!", organizationSlug: "", organizationEmail: "", timezone: "Africa/Nairobi", dataRetentionDays: "2555", plan: "FREE", accountType: "LANDLORD" });
    assert.deepEqual(Object.keys(errors), ["organizationSlug"]);
  });
});
