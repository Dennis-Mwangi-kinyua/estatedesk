import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { configureTestDatabase } from "./database-safety";
const databaseUrl = configureTestDatabase();

test("organization features preserve concurrent changes and hide only scoped public vacancies", { skip: !databaseUrl }, async () => {
  const { prisma } = await import("../../apps/web/src/lib/prisma");
  const { updateOrganizationFeature } = await import("../../apps/web/src/lib/org/update-feature");
  const { publicListedVacancyWhere, publicVacancyFeatureWhere, buildVacancyListWhere } = await import("../../services/public-vacancy/src/where");
  const suffix = randomUUID();
  const user = await prisma.user.create({ data: { fullName: "Scoped feature operator", passwordHash: "test-only" } });
  const orgs = await Promise.all(["target", "other"].map(name => prisma.organization.create({ data: { name, slug: `feature-${name}-${suffix}` } })));
  const [target, other] = orgs;
  try {
    for (const org of orgs) {
      const property = await prisma.property.create({ data: { orgId: org.id, name: `Feature visibility ${suffix}` } });
      await prisma.unit.create({ data: { propertyId: property.id, houseNo: "A1", rentAmount: 1000, status: "VACANT", isPubliclyListed: true } });
    }
    const set = (key: Parameters<typeof updateOrganizationFeature>[1]["key"], enabled: boolean) => updateOrganizationFeature(prisma, { orgId: target.id, actorUserId: user.id, key, enabled });
    const visible = (global: Record<string, boolean>, search = "") => prisma.unit.findMany({ where: {
      ...buildVacancyListWhere({ query: search }, { ...publicListedVacancyWhere, AND: [publicVacancyFeatureWhere(global)] }),
      property: { is: { ...publicListedVacancyWhere.property.is, orgId: { in: orgs.map(org => org.id) } } },
    }, select: { property: { select: { orgId: true } } } });
    assert.equal((await visible({})).length, 2);
    await Promise.all([set("publicVacanciesHidden", true), set("waterBilling", false), set("inspections", false)]);
    const settings = await prisma.organizationSettings.findUniqueOrThrow({ where: { orgId: target.id } });
    assert.deepEqual(settings.features, { publicVacanciesHidden: true, waterBilling: false, inspections: false });
    for (const globals of [{}, { vacantHouses: true }] as Record<string, boolean>[]) {
      assert.deepEqual((await visible(globals)).map(row => row.property.orgId), [other.id]);
      assert.deepEqual((await visible(globals, suffix)).map(row => row.property.orgId), [other.id]);
    }
    assert.equal((await visible({ vacantHouses: false })).length, 0);
    assert.equal(await prisma.organizationSettings.count({ where: { orgId: other.id } }), 0);
    assert.equal(await prisma.auditLog.count({ where: { orgId: target.id, action: "PLATFORM_FEATURE_FLAG_UPDATED" } }), 3);
    await set("publicVacanciesHidden", false);
    assert.equal((await visible({})).length, 2);
    await prisma.organization.update({ where: { id: target.id }, data: { deletedAt: new Date(), status: "DISABLED" } });
    assert.equal(await set("waterBilling", true), null);
  } finally {
    await prisma.organization.deleteMany({ where: { id: { in: orgs.map(org => org.id) } } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
});
