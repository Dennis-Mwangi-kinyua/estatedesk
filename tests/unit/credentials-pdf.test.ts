import assert from "node:assert/strict";
import { test } from "node:test";
import { PDFDocument } from "pdf-lib";
import { createCredentialsPdf } from "../../apps/web/src/app/(app)/platform/organizations/new/_lib/credentials-pdf";

const account = {
  organizationName: "Example agency", slug: "example-agency", accountType: "PROPERTY_MANAGER",
  fullName: "Jane Example", username: "jane.example", email: "jane@example.test",
  phone: null, plan: "FREE",
};

test("creates a readable credentials PDF for an agency", async () => {
  const bytes = await createCredentialsPdf(account, "Example-Temporary-Password", "https://example.test/login");
  assert.equal(new TextDecoder().decode(bytes.slice(0, 5)), "%PDF-");
  const pdf = await PDFDocument.load(bytes);
  assert.ok(pdf.getPageCount() >= 1);
  assert.equal(pdf.getPages()[0].getWidth(), 595.28);
});

test("supports landlord details, Unicode, and long values without overflowing a page", async () => {
  const bytes = await createCredentialsPdf({ ...account, accountType: "LANDLORD", organizationName: "Jane’s portfolio 🏠".repeat(30), fullName: "José Example", phone: "+254700000000" }, "unicode-🔐-password", "https://example.test/login");
  const pdf = await PDFDocument.load(bytes);
  assert.ok(pdf.getPageCount() > 1);
});
