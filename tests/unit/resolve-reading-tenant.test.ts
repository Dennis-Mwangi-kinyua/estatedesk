import assert from "node:assert/strict";
import test from "node:test";
import {
  formatResolvedTenantLabel,
  resolveReadingTenant,
} from "../../apps/web/src/app/(app)/dashboard/org/water-bills/_lib/resolve-tenant";

test("prefers water bill tenant for the reading period", () => {
  const tenant = resolveReadingTenant({
    period: "2026-07",
    waterBills: [
      {
        period: "2026-07",
        tenant: { fullName: "tenant101", phone: "0700", status: "ACTIVE" },
      },
    ],
    leases: [
      {
        status: "ACTIVE",
        tenant: { fullName: "Someone Else", phone: "0711", status: "ACTIVE" },
      },
    ],
  });
  assert.equal(tenant?.fullName, "tenant101");
  assert.equal(tenant?.source, "water_bill");
});

test("falls back to active lease when no bill tenant", () => {
  const tenant = resolveReadingTenant({
    period: "2026-07",
    waterBills: [],
    leases: [
      {
        status: "EXPIRED",
        startDate: new Date("2025-01-01"),
        tenant: { fullName: "Old Tenant", status: "ACTIVE" },
      },
      {
        status: "ACTIVE",
        startDate: new Date("2026-01-01"),
        tenant: { fullName: "tenant101", phone: "0700", status: "ACTIVE" },
      },
    ],
  });
  assert.equal(tenant?.fullName, "tenant101");
  assert.equal(tenant?.source, "active_lease");
});

test("does not show blacklisted-only or missing tenants as active", () => {
  const tenant = resolveReadingTenant({
    period: "2026-07",
    waterBills: [
      {
        period: "2026-07",
        tenant: { fullName: "Bad", status: "BLACKLISTED" },
      },
    ],
    leases: [],
  });
  assert.equal(tenant, null);
  assert.equal(formatResolvedTenantLabel(null), "No tenant on file");
});
