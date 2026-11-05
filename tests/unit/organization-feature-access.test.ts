import test from "node:test";
import assert from "node:assert/strict";
import { applyFeatureAccess, applyGlobalFeatureOverrides, featureBlocksPath } from "../../apps/web/src/lib/org/features";
import { canAccessWorkspacePath, canDiscoverWorkspaceHref } from "../../apps/web/src/lib/permissions/workspace-access";
import { buildVacancyListWhere, publicListedVacancyWhere, publicVacancyFeatureWhere } from "../../services/public-vacancy/src/where";

test("disabled features are hidden and inaccessible even to organization admins", () => {
  const orgRolePolicy = applyFeatureAccess({ permissions: { "inspections.manage": "allow" }, blockedViews: ["reports"] }, { inspections: false, waterBilling: false, taxes: false, vacantHouses: false });
  const session = { platformRole: "USER" as const, activeOrgRole: "ADMIN" as const, activeOrgId: "org-a", orgRolePolicy };
  for (const path of ["/dashboard/org/inspections", "/dashboard/org/water-bills", "/dashboard/org/taxes", "/dashboard/org/vacancy-inquiries", "/dashboard/org/reports"]) {
    assert.equal(canDiscoverWorkspaceHref(session, path), false, path);
    assert.equal(canAccessWorkspacePath(session, path), false, path);
  }
  assert.equal(canAccessWorkspacePath(session, "/dashboard/org/properties"), true);
});

test("platform overrides win without removing unrelated role restrictions", () => {
  const features = applyGlobalFeatureOverrides({ inspections: false }, { inspections: true });
  assert.deepEqual(applyFeatureAccess({ permissions: {}, blockedViews: ["taxes"] }, features).blockedViews, ["taxes"]);
  assert.deepEqual(applyFeatureAccess(undefined, {}).blockedViews, []);
});

test("tenant portal switches cover root, nested pages, and both APIs", () => {
  for (const path of ["/dashboard/tenant", "/dashboard/tenant/payments", "/api/mobile/tenant/leases", "/api/tenant/documents"]) {
    assert.equal(featureBlocksPath({ tenantPortal: false }, path), true);
    assert.equal(featureBlocksPath({}, path), false);
  }
  assert.equal(featureBlocksPath({ tenantPortal: false }, "/dashboard/org/tenants"), false);
});

test("public listing feature overrides preserve organization status restrictions and search eligibility", () => {
  assert.deepEqual(publicVacancyFeatureWhere({ vacantHouses: false }), { id: { in: [] } });
  assert.deepEqual(publicVacancyFeatureWhere({ vacantHouses: true }), {});
  const inherited = publicVacancyFeatureWhere({});
  assert.deepEqual(inherited, { property: { is: { org: { is: { NOT: { settings: { is: { features: { path: ["vacantHouses"], equals: false } } } } } } } } });
  const eligibility = { ...publicListedVacancyWhere, AND: [inherited] };
  const filtered = buildVacancyListWhere({ query: "Nairobi", bedrooms: 2 }, eligibility);
  assert.equal((filtered.AND as unknown[])[0], eligibility);
  assert.deepEqual(publicListedVacancyWhere.property.is.org.is, { status: "ACTIVE", deletedAt: null });
});
