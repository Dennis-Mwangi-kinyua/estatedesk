import assert from "node:assert/strict";
import { it } from "node:test";
import { directoryFilters, readPage, tenantAuditFilter } from "../../apps/web/src/app/(app)/platform/organizations/[slug]/tenants/filters";

it("keeps tenant searches scoped to the selected organization and excludes deleted records", () => {
  const filters = directoryFilters("org-one", { q: "  Jane  ", status: "ACTIVE" });
  assert.equal(filters.q, "Jane");
  assert.equal(filters.where.orgId, "org-one");
  assert.equal(filters.where.deletedAt, null);
  assert.equal(filters.where.status, "ACTIVE");
  assert.equal(filters.where.OR?.length, 4);
});
it("ignores invalid status filters and bounds search input and pagination", () => {
  const filters = directoryFilters("org-two", { q: "x".repeat(500), status: "INVALID" });
  assert.equal(filters.q.length, 150);
  assert.equal(filters.status, "");
  assert.equal(filters.where.orgId, "org-two");
  for (const page of [undefined, "0", "-1", "NaN", "Infinity", "1.5"]) assert.equal(readPage(page), 1);
  assert.equal(readPage("3"), 3);
  assert.equal(readPage("999999"), 100000);
});
it("limits individual audit activity to the tenant record and linked user inside this organization", () => {
  assert.deepEqual(tenantAuditFilter("org-one", "tenant-one", "user-one"), { orgId: "org-one", OR: [{ entityType: "Tenant", entityId: "tenant-one" }, { actorUserId: "user-one" }] });
  assert.deepEqual(tenantAuditFilter("org-one", "tenant-one", null), { orgId: "org-one", OR: [{ entityType: "Tenant", entityId: "tenant-one" }] });
});
