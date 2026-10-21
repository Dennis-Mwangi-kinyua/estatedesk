import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";
import {
  DATA_EXPORT_REASON_MAX_LENGTH,
  DATA_EXPORT_REASON_MIN_LENGTH,
  validateDataExportDelivery,
  validateDataExportReason,
} from "../../apps/web/src/lib/platform/data-export-policy";
import { buildDataExportAlertEmail } from "../../apps/web/src/lib/platform/data-export-email-template";
import {
  isClosedOnboardingStatus,
  isOnboardingAlertPending,
  ONBOARDING_REQUEST_STATUSES,
} from "../../apps/web/src/lib/platform/onboarding-status";

it("requires a useful export reason and enforces its maximum length", () => {
  assert.match(validateDataExportReason(null) ?? "", /at least 50 characters/);
  assert.match(validateDataExportReason("Too short") ?? "", /at least 50 characters/);
  assert.equal(validateDataExportReason("x".repeat(DATA_EXPORT_REASON_MIN_LENGTH)), null);
  assert.equal(validateDataExportReason("x".repeat(DATA_EXPORT_REASON_MAX_LENGTH)), null);
  assert.match(validateDataExportReason("x".repeat(DATA_EXPORT_REASON_MAX_LENGTH + 1)) ?? "", /1,200 characters or fewer/);
});

it("accepts either secure download or validated email delivery", () => {
  assert.equal(validateDataExportDelivery("DOWNLOAD", null), null);
  assert.equal(validateDataExportDelivery("EMAIL", "exports@example.test"), null);
  assert.match(validateDataExportDelivery("EMAIL", null) ?? "", /valid email address/);
  assert.match(validateDataExportDelivery("EMAIL", "bad-address") ?? "", /valid email address/);
  assert.match(validateDataExportDelivery("OTHER", null) ?? "", /Choose download or email/);
});

it("emails platform admins the export reason and a direct review link", () => {
  const email = buildDataExportAlertEmail({
    organizationName: "Palm Court",
    requesterName: "Jane Mwangi",
    requesterEmail: "jane@example.test",
    reason: "We need the tenant and lease archive for a verified migration to our new system.",
    deliveryMethod: "EMAIL",
    deliveryEmail: "archive@example.test",
    requestedAt: new Date("2026-10-21T08:00:00.000Z"),
    reviewUrl: "https://estatedesk.co.ke/platform/data-management",
  });
  assert.equal(email.subject, "CSV export request: Palm Court");
  assert.match(email.text, /Jane Mwangi \(jane@example\.test\)/);
  assert.match(email.text, /verified migration/);
  assert.match(email.text, /Email to archive@example\.test/);
  assert.match(email.text, /https:\/\/estatedesk\.co\.ke\/platform\/data-management/);
});

it("clears the new onboarding alert when a request is contacted or closed", () => {
  assert.ok(ONBOARDING_REQUEST_STATUSES.includes("CONTACTED"));
  assert.ok(ONBOARDING_REQUEST_STATUSES.includes("WON"));
  assert.ok(ONBOARDING_REQUEST_STATUSES.includes("DISQUALIFIED"));
  assert.equal(isOnboardingAlertPending("NEW"), true);
  for (const status of ["CONTACTED", "QUALIFIED", "WON", "DISQUALIFIED"]) {
    assert.equal(isOnboardingAlertPending(status), false, status);
  }
  assert.equal(isClosedOnboardingStatus("WON"), true);
  assert.equal(isClosedOnboardingStatus("DISQUALIFIED"), true);
});

it("keeps the org support-session banner visible below the sticky header", () => {
  const shell = readFileSync("apps/web/src/components/layout/org-dashboard-shell.tsx", "utf8");
  assert.match(shell, /sticky top-\[108px\] z-\[105\] lg:top-16/);
  assert.match(shell, /<SupportSessionBanner session=\{supportSession\}/);
});
