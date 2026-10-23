import test from "node:test";
import assert from "node:assert/strict";
import { vacancyCosts } from "../../apps/web/src/lib/vacancy-costs";
import { vacancyInquiryInputSchema } from "../../apps/web/src/lib/vacancy-inquiry-input";
import { publicListedVacancyWhere } from "../../services/public-vacancy/src/where";

test("initial cost includes deposit and each listed fee without floating-point drift", () => {
  const result = vacancyCosts({ rentAmount: "10000.10", depositAmount: "10000.10", serviceCharge: "100.20", garbageFee: 0, securityFee: "50.05", viewingFeeRequired: true, viewingFeeAmount: "20.05" });
  assert.equal(result.knownTotal, 20170.5);
  assert.equal(result.complete, true);
});
test("missing fees are unknown, zero is free and nonrequired viewing fees are excluded", () => {
  const result = vacancyCosts({ rentAmount: 10000, depositAmount: null, serviceCharge: 0, garbageFee: undefined, securityFee: -1, viewingFeeRequired: false, viewingFeeAmount: 500 });
  assert.equal(result.knownTotal, 10000);
  assert.equal(result.complete, false);
  assert.equal(result.rows.find(row => row.label === "Service charge")?.amount, 0);
  assert.equal(result.rows.some(row => row.label === "Viewing fee"), false);
});
test("public listings exclude active leases and inactive organizations", () => {
  assert.deepEqual(publicListedVacancyWhere.leases, { none: { status: "ACTIVE" } });
  assert.equal(publicListedVacancyWhere.status, "VACANT");
  assert.equal(publicListedVacancyWhere.property.is.org.is.status, "ACTIVE");
});
test("public inquiry validates bounded contact details and budget", () => {
  const input = { fullName: "Test Viewer", phone: "+254 712 345 678", email: "", message: "I would like to arrange a viewing.", preferredLocation: "", budget: "10000.50", referralSource: "search" };
  assert.equal(vacancyInquiryInputSchema.parse(input).email, null);
  for (const invalid of [{ phone: "invalid" }, { email: "not-email" }, { message: "x".repeat(3001) }, { fullName: "" }, { budget: "-1" }, { budget: "1.234" }, { referralSource: "injected" }]) assert.equal(vacancyInquiryInputSchema.safeParse({ ...input, ...invalid }).success, false);
});
