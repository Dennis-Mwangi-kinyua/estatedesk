import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildVacancyInquiriesPageHref,
  formatInquiryStatus,
  inquiryStatusClasses,
} from "../../apps/web/src/app/(app)/dashboard/org/vacancy-inquiries/_lib/helpers";

describe("buildVacancyInquiriesPageHref", () => {
  it("returns the base path when no filters are active", () => {
    assert.equal(
      buildVacancyInquiriesPageHref(1),
      "/dashboard/org/vacancy-inquiries",
    );
  });

  it("includes page and status query params when provided", () => {
    assert.equal(
      buildVacancyInquiriesPageHref(3, "NEW"),
      "/dashboard/org/vacancy-inquiries?status=NEW&page=3",
    );
  });

  it("omits ALL status from the query string", () => {
    assert.equal(
      buildVacancyInquiriesPageHref(2, "ALL"),
      "/dashboard/org/vacancy-inquiries?page=2",
    );
  });
});

describe("formatInquiryStatus", () => {
  it("formats enum-like statuses for display", () => {
    assert.equal(formatInquiryStatus("VIEWING_SCHEDULED"), "Viewing Scheduled");
  });
});

describe("inquiryStatusClasses", () => {
  it("returns accent classes for new inquiries", () => {
    assert.match(inquiryStatusClasses("NEW"), /amber/);
  });
});