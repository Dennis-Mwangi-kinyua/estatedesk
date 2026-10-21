import assert from "node:assert/strict";
import { it } from "node:test";
import { scopedUnitWhere, scopedPaymentWhere, scopedPropertyWhere, scopedIssueWhere, canViewWholeProperty } from "../../apps/web/src/lib/permissions/record-scope";
it("enforces organization plus assigned property, building, or unit", () => {
  const base = { deletedAt: null, property: { orgId: "org-a", deletedAt: null } };
  assert.deepEqual(scopedUnitWhere("org-a", { scopeType: "PROPERTY", scopeId: "p1" }), { ...base, propertyId: "p1" });
  assert.deepEqual(scopedUnitWhere("org-a", { scopeType: "BUILDING", scopeId: "b1" }), { ...base, buildingId: "b1" });
  assert.deepEqual(scopedUnitWhere("org-a", { scopeType: "UNIT", scopeId: "u1" }), { ...base, id: "u1" });
  assert.deepEqual(scopedUnitWhere("org-a", { scopeType: "ORG", scopeId: "ORG_SCOPE" }), base);
});
it("fails closed for missing or unknown membership scopes", () => {
  for (const scope of [null, undefined, { scopeType: "INVALID", scopeId: "x" }]) assert.deepEqual(scopedUnitWhere("org-a", scope).id, { in: [] });
  assert.deepEqual(scopedPropertyWhere("org-a", null).id, { in: [] });
  assert.deepEqual(scopedIssueWhere("org-a", null), { orgId: "org-a", unit: { is: scopedUnitWhere("org-a", null) } });
});
it("limits property, issue, and property-summary records to compatible scope levels", () => {
  assert.deepEqual(scopedPropertyWhere("org-a", { scopeType: "PROPERTY", scopeId: "p1" }), { orgId: "org-a", deletedAt: null, id: "p1" });
  assert.equal(canViewWholeProperty({ scopeType: "ORG", scopeId: "ORG_SCOPE" }), true);
  assert.equal(canViewWholeProperty({ scopeType: "PROPERTY", scopeId: "p1" }), true);
  assert.equal(canViewWholeProperty({ scopeType: "UNIT", scopeId: "u1" }), false);
  assert.deepEqual(scopedIssueWhere("org-a", { scopeType: "UNIT", scopeId: "u1" }), { orgId: "org-a", unit: { is: scopedUnitWhere("org-a", { scopeType: "UNIT", scopeId: "u1" }) } });
});
it("requires a matching charge or bill and excludes mixed out-of-scope allocations", () => {
  const where = scopedPaymentWhere("org-a", { scopeType: "PROPERTY", scopeId: "p1" });
  assert.equal(where.orgId, "org-a");
  const predicates = where.AND as object[];
  assert.ok(predicates.some(predicate => "allocations" in predicate && "none" in (predicate.allocations as object)));
  assert.deepEqual(scopedPaymentWhere("org-a", { scopeType: "ORG", scopeId: "ORG_SCOPE" }), { orgId: "org-a" });
});

it("validates every scope and mixed-allocation filter against the generated Prisma schema", async () => {
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const adapter = new PrismaPg({ connectionString: "postgresql://localhost/record-scope-validation" });
  const connect = adapter.connect.bind(adapter);
  adapter.connect = async () => {
    const connection = await connect();
    connection.queryRaw = async () => ({ columnNames: [], columnTypes: [], rows: [] });
    return connection;
  };
  const client = new PrismaClient({ adapter });
  try {
    for (const scope of [null, { scopeType: "ORG", scopeId: "org-a" }, { scopeType: "PROPERTY", scopeId: "p1" }, { scopeType: "BUILDING", scopeId: "b1" }, { scopeType: "UNIT", scopeId: "u1" }]) {
      await assert.doesNotReject(() => client.unit.findMany({ where: scopedUnitWhere("org-a", scope), take: 1, select: { id: true } }));
      await assert.doesNotReject(() => client.payment.findMany({ where: scopedPaymentWhere("org-a", scope), take: 1, select: { id: true } }));
      await assert.doesNotReject(() => client.property.findMany({ where: scopedPropertyWhere("org-a", scope), take: 1, select: { id: true } }));
      await assert.doesNotReject(() => client.issueTicket.findMany({ where: scopedIssueWhere("org-a", scope), take: 1, select: { id: true } }));
    }
  } finally { await client.$disconnect(); }
});
