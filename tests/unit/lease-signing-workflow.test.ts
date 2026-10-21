import assert from "node:assert/strict";
import { it } from "node:test";
import { leaseTenantReadiness, leaseSigningSteps, signerCanSign } from "../../apps/web/src/lib/leases/signing-workflow";
it("requires an active tenant account and first login before sending", () => {
  assert.ok(leaseTenantReadiness(null));
  assert.ok(leaseTenantReadiness({ status: "SUSPENDED", lastLoginAt: new Date() }));
  assert.ok(leaseTenantReadiness({ status: "ACTIVE", lastLoginAt: null }));
  assert.equal(leaseTenantReadiness({ status: "ACTIVE", lastLoginAt: new Date() }), null);
});
it("puts every tenant before organization countersigning and witnesses after", () => {
  assert.deepEqual(leaseSigningSteps([]), { tenant: 1, organization: 2, additional: [] });
  assert.deepEqual(leaseSigningSteps(["WITNESS", "TENANT", "GUARANTOR", "TENANT"]), { tenant: 1, organization: 4, additional: [5, 2, 6, 3] });
});
it("blocks countersigning until the tenant has signed and prevents repeat signatures", () => {
  const tenant = { signingOrder: 1, status: "PENDING" };
  const org = { signingOrder: 2, status: "PENDING" };
  assert.equal(signerCanSign(tenant, [tenant, org]), true);
  assert.equal(signerCanSign(org, [tenant, org]), false);
  assert.equal(signerCanSign(org, [{ ...tenant, status: "SIGNED" }, org]), true);
  assert.equal(signerCanSign({ ...org, status: "SIGNED" }, [{ ...tenant, status: "SIGNED" }]), false);
});
