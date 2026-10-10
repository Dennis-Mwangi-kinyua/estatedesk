import assert from "node:assert/strict";
import test from "node:test";
import { configureTestDatabase } from "./database-safety";
const databaseUrl = configureTestDatabase();

test("CSV initial charges and conservative backfill are atomic and repeatable", { skip: !databaseUrl }, async () => {
  const [{ fixture }, { importCsv }, { backfillInitialCharges }] = await Promise.all([
    import("./move-out-fixture"), import("../../apps/web/src/lib/imports/csv-import"),
    import("../../apps/web/src/lib/billing/backfill-initial-charges"),
  ]);
  const f = await fixture();
  try {
    const property = await f.prisma.property.findUniqueOrThrow({ where: { id: f.unit.propertyId } });
    const unit = await f.prisma.unit.create({ data: { propertyId: property.id, houseNo: "IMPORT", rentAmount: 10000, depositAmount: 5000 } });
    const result = await importCsv({ orgId: f.org.id, kind: "tenants", dryRun: false, csv: `fullName,phone,propertyName,unitHouseNo\nImported tenant,254711111111,${property.name},IMPORT` });
    assert.equal(result.ok, true, result.errors.join(", "));
    const lease = await f.prisma.lease.findFirstOrThrow({ where: { unitId: unit.id } });
    assert.equal(await f.prisma.rentCharge.count({ where: { leaseId: lease.id } }), 2);
    await f.prisma.rentCharge.deleteMany({ where: { leaseId: lease.id, chargeType: "DEPOSIT" } });
    const run = (apply = false) => f.prisma.$transaction(tx => backfillInitialCharges(tx, lease.id, apply, f.actor.id), { isolationLevel: "Serializable", timeout: 15000 });
    assert.equal((await run()).status, "eligible");
    assert.equal(await f.prisma.rentCharge.count({ where: { leaseId: lease.id } }), 1);
    assert.equal((await run(true)).status, "created");
    assert.equal((await run(true)).status, "complete");
    assert.equal(await f.prisma.rentCharge.count({ where: { leaseId: lease.id } }), 2);
    await f.prisma.rentCharge.deleteMany({ where: { leaseId: lease.id, chargeType: "DEPOSIT" } });
    await f.prisma.payment.create({ data: { orgId: f.org.id, payerTenantId: lease.tenantId, amount: 5000, method: "CASH", targetType: "DEPOSIT", verificationStatus: "VERIFIED", gatewayStatus: "SUCCESS" } });
    assert.equal((await run(true)).status, "review");
    assert.equal(await f.prisma.rentCharge.count({ where: { leaseId: lease.id } }), 1);
    assert.equal((await f.prisma.$transaction(tx => backfillInitialCharges(tx, f.lease.id, true, f.actor.id))).status, "review");
  } finally { await f.cleanup(); }
});
