import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { organizationPurgePlan } from "../../scripts/generate-org-purge-plan.mjs";
import { ORGANIZATION_PURGE_PLAN } from "../../apps/web/src/lib/data-retention/organization-purge-plan";
import { organizationOwnedWhere, organizationPurgeWhere } from "../../apps/web/src/lib/data-retention/organization-deletion";

test("purge plan covers every organization-owned model and follows current schema dependencies", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  assert.deepEqual(ORGANIZATION_PURGE_PLAN, organizationPurgePlan(schema));
  const names = new Set<string>(ORGANIZATION_PURGE_PLAN.map(entry => entry.model));
  for (const [, name, body] of schema.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)) {
    if (/\borgId\s+String/.test(body)) assert.ok(names.has(name), `${name} must have an organization purge scope`);
  }
  for (const shared of ["User", "UserSession", "ServiceProvider", "TenantIdentity", "IdentityClaim"]) assert.equal(names.has(shared), false);
  assert.ok(ORGANIZATION_PURGE_PLAN.findIndex(entry => entry.model === "AccountingJournalLine") < ORGANIZATION_PURGE_PLAN.findIndex(entry => entry.model === "AccountingAccount"));
});

test("retention requires 30 full days, disabled status and an explicit deletion marker", () => {
  const where = organizationPurgeWhere(new Date("2026-12-01T12:00:00Z"));
  assert.deepEqual(where, { status: "DISABLED", deletedAt: { lte: new Date("2026-11-01T12:00:00Z") }, auditLogs: { some: { action: "ORGANIZATION_DELETE_REQUESTED", entityType: "Organization", createdAt: { lte: new Date("2026-11-01T12:00:00Z") } } } });
});


test("CRM activity retention covers tenant scope and organization customer ownership", () => {
  const entry = ORGANIZATION_PURGE_PLAN.find(item => item.model === "CrmActivity");
  assert.ok(entry);
  assert.deepEqual(organizationOwnedWhere(entry, "deleted-org"), { OR: [{ customerOrgId: "deleted-org" }, { scopeOrgId: "deleted-org" }] });
  assert.ok(ORGANIZATION_PURGE_PLAN.findIndex(item => item.model === "CrmActivity") < ORGANIZATION_PURGE_PLAN.findIndex(item => item.model === "Tenant"));
});
