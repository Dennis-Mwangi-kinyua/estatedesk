import assert from "node:assert/strict";
import { test } from "node:test";
import { careerMetadata, careerSearch, jobStructuredData } from "../../apps/web/src/features/recruitment/seo";
import { serializeJsonForHtml } from "../../apps/web/src/lib/security/safe-json";

test("career pagination is canonical and arbitrary searches are noindex", () => {
  assert.match(String(careerMetadata({ page: "2" }).alternates?.canonical), /\/careers\?page=2$/);
  for (const input of [{ q: "manager" }, { employer: "platform" }, { location: "Nairobi", page: "3" }]) {
    assert.equal((careerMetadata(input).robots as { index: boolean }).index, false);
  }
  assert.equal((careerMetadata({}).robots as { index: boolean }).index, true);
  assert.equal(careerSearch({ page: "Infinity" }).page, 10000);
  assert.equal(careerSearch({ page: "-2" }).page, 1);
});

test("job schema reflects employer, dates, salary and safely escaped published content", () => {
  const job = { id: "one", slug: "manager-one", title: "Manager", description: "Manage <script>alert(1)</script>\nproperties", requirements: "Experience & care", location: "Nairobi, Kenya", employmentType: "CONTRACT", workplace: "HYBRID", publishedAt: new Date("2026-11-01T00:00:00Z"), closesAt: new Date("2026-12-01T00:00:00Z"), salaryMin: "0", salaryMax: "50000", salaryPeriod: "MONTH", currencyCode: "KES", org: { name: "Hiring organization", slug: "hiring" } };
  const result = jobStructuredData(job);
  assert.equal(result.hiringOrganization.name, "Hiring organization");
  assert.equal(result.employmentType, "CONTRACTOR");
  assert.equal(result.baseSalary?.value.minValue, 0);
  assert.equal(result.validThrough, job.closesAt.toISOString());
  assert.match(result.description, /&lt;script&gt;/);
  assert.ok(!serializeJsonForHtml(result).includes("<"));
  const remote = jobStructuredData({ ...job, workplace: "REMOTE", employmentType: "INTERNSHIP", org: null, salaryMin: null, salaryMax: null });
  assert.equal(remote.hiringOrganization.name, "EstateDesk");
  assert.equal(remote.jobLocationType, "TELECOMMUTE");
  assert.equal(remote.employmentType, "INTERN");
  assert.ok(!("baseSalary" in remote));
  assert.ok(!("addressCountry" in remote.jobLocation.address));
});
