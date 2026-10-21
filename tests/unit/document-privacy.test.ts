import assert from "node:assert/strict";
import { it } from "node:test";
import { maskedDocumentIdentity, publicVerificationSummary } from "../../apps/web/src/lib/documents/verification-privacy";
import { publicHealthSummary } from "../../apps/web/src/lib/ops/public-health";
it("public verification whitelists registry fields and masks every name component", () => {
  const document = { documentType: "LEASE", status: "COMPLETED", expiresAt: null, serialNumber: "ED-123", issuedAt: new Date(), contentHash: "abc", metadata: { tenantPhone: "private", monthlyRent: 50000 }, title: "Lease for Jane Doe" };
  const result = publicVerificationSummary(document, "Jane Doe");
  assert.equal(result.identity, "J*** D***");
  assert.equal(result.valid, true);
  assert.ok(!JSON.stringify(result).includes("private"));
  assert.ok(!JSON.stringify(result).includes("50000"));
  assert.ok(!JSON.stringify(result).includes("Jane"));
  assert.equal(maskedDocumentIdentity(null), "Identity withheld");
});
it("revoked and expired documents remain invalid without exposing their contents", () => {
  const data = { documentType: "INVOICE", status: "REVOKED", expiresAt: null, serialNumber: "ED-1", issuedAt: new Date(), contentHash: null };
  assert.equal(publicVerificationSummary(data).valid, false);
  assert.equal(publicVerificationSummary({ ...data, status: "ISSUED", expiresAt: new Date(0) }).status, "EXPIRED");
});
it("public health output drops configuration, database, and operation details", () => {
  const input = { service: "estatedesk", status: "ok" as const, checkedAt: "now", environment: { missingRequired: ["SECRET"] }, database: { host: "private" }, ops: { failedPayments: 99 } };
  assert.deepEqual(publicHealthSummary(input), { service: "estatedesk", status: "ok", checkedAt: "now" });
});
