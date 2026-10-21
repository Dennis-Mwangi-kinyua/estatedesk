import assert from "node:assert/strict";
import { it } from "node:test";
import { auditPage, auditDetailValue, auditExport } from "../../apps/web/src/lib/audit/log-detail";
it("identifies captured pages without guessing missing historical routes", () => {
  assert.equal(auditPage({ entityType: "Route", entityId: "/dashboard/org/tenants?secret=value", metadata: null }), "/dashboard/org/tenants");
  assert.equal(auditPage({ entityType: "Tenant", entityId: "tenant-one", metadata: { pathname: "/dashboard/org/tenants/jane" } }), "/dashboard/org/tenants/jane");
  assert.equal(auditPage({ entityType: "Tenant", entityId: "tenant-one", metadata: {} }), null);
  assert.equal(auditPage({ entityType: "Route", entityId: "/sign-lease/private-token", metadata: null }), "/sign-lease/[redacted]");
});
it("redacts nested credentials and payloads while preserving troubleshooting context", () => {
  assert.deepEqual(auditDetailValue({ before: { passwordHash: "private", role: "OFFICE" }, metadata: [{ authorization: "private", contentHash: "hash" }] }), { before: { passwordHash: "[REDACTED]", role: "OFFICE" }, metadata: [{ authorization: "[REDACTED]", contentHash: "hash" }] });
});
it("exports captured log details and explicitly marks an unknown page", () => {
  const result = auditExport({ id: "log1", action: "UPDATED", createdAt: new Date(), entityType: "Tenant", entityId: "tenant1", metadata: {}, beforeState: { status: "ACTIVE" }, afterState: { status: "INACTIVE" } });
  assert.equal(result.pageCaptured, false);
  assert.equal(result.schemaVersion, 1);
  assert.ok(result.log);
});
