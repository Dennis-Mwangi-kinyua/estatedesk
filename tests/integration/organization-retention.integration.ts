import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { configureTestDatabase } from "./database-safety";
const databaseUrl = configureTestDatabase();

test("30-day purge removes linked records while preserving other organizations and shared accounts", { skip: !databaseUrl }, async () => {
  const { prisma } = await import("../../apps/web/src/lib/prisma");
  const { purgeOrganization, organizationPurgeWhere } = await import("../../apps/web/src/lib/data-retention/organization-deletion");
  const suffix = randomUUID();
  const now = new Date("2026-12-01T12:00:00Z");
  const old = new Date(now.getTime() - 31 * 86400000);
  const user = await prisma.user.create({ data: { fullName: "Shared retention test account", passwordHash: "test-only" } });
  const orgs = await Promise.all(["due", "young", "legacy", "active"].map((kind, index) => prisma.organization.create({ data: {
    name: `Retention ${kind}`, slug: `retention-${kind}-${suffix}`, status: index === 3 ? "ACTIVE" : "DISABLED",
    deletedAt: index === 3 ? null : index === 1 ? new Date(now.getTime() - 29 * 86400000) : old,
  } })));
  const [due, young, legacy, active] = orgs;
  let salesLeadId: string | undefined;
  try {
    for (const org of [due, young]) await prisma.auditLog.create({ data: { orgId: org.id, actorUserId: user.id, action: "ORGANIZATION_DELETE_REQUESTED", entityType: "Organization", entityId: org.id, createdAt: org.deletedAt! } });
    for (const org of [due, active]) {
      await prisma.membership.create({ data: { orgId: org.id, userId: user.id, role: "ADMIN" } });
      const account = await prisma.accountingAccount.create({ data: { orgId: org.id, code: "1000", name: "Cash", type: "ASSET", normalBalance: "DEBIT" } });
      await prisma.accountingJournalEntry.create({ data: { orgId: org.id, entryNumber: "J1", entryDate: now, sourceType: "MANUAL", description: "Linked accounting record", lines: { create: { orgId: org.id, accountId: account.id, debit: 100 } } } });
      const property = await prisma.property.create({ data: { orgId: org.id, name: "Retained property" } });
      await prisma.unit.create({ data: { propertyId: property.id, houseNo: "1", rentAmount: 1000 } });
      const tenant = await prisma.tenant.create({ data: { orgId: org.id, userId: user.id, fullName: "Retained tenant", phone: org.slug } });
      await prisma.crmActivity.create({ data: { tenantId: tenant.id, scopeOrgId: org.id, authorId: user.id, body: "Organization customer history" } });
      await prisma.crmActivity.create({ data: { customerOrgId: org.id, authorId: user.id, body: "Platform customer history" } });
    }
    const salesLead = await prisma.onboardingRequest.create({ data: { fullName: "Platform prospect", companyName: "Platform sales retention", workEmail: "retention@example.invalid", managedPropertyType: "Residential", customerOrgId: due.id } });
    salesLeadId = salesLead.id;
    await prisma.crmActivity.create({ data: { leadId: salesLead.id, authorId: user.id, body: "Preserved platform sales history" } });
    assert.deepEqual((await prisma.organization.findMany({ where: organizationPurgeWhere(now), select: { id: true } })).filter(org => orgs.some(item => item.id === org.id)), [{ id: due.id }]);
    const { loadVerifyTenantPageData } = await import("../../apps/web/src/app/(app)/dashboard/org/verify-tenant/_lib/queries");
    assert.equal((await loadVerifyTenantPageData(active.id, { q: due.slug })).results.length, 0, "Other organizations must not see retained deleted tenants");
    assert.equal((await loadVerifyTenantPageData(active.id, { q: active.slug })).results.length, 1);
    assert.equal(await purgeOrganization(prisma, young.id, now), false);
    assert.equal(await purgeOrganization(prisma, legacy.id, now), false);
    assert.equal(await purgeOrganization(prisma, active.id, now), false);
    assert.equal(await purgeOrganization(prisma, due.id, now), true);
    assert.equal(await purgeOrganization(prisma, due.id, now), false);
    assert.equal(await prisma.organization.count({ where: { id: due.id } }), 0);
    assert.equal(await prisma.accountingJournalLine.count({ where: { orgId: due.id } }), 0);
    assert.equal(await prisma.unit.count({ where: { property: { orgId: due.id } } }), 0);
    assert.equal(await prisma.user.count({ where: { id: user.id } }), 1);
    assert.equal(await prisma.membership.count({ where: { orgId: active.id, userId: user.id } }), 1);
    assert.equal(await prisma.accountingJournalLine.count({ where: { orgId: active.id } }), 1);
    assert.equal(await prisma.tenant.count({ where: { orgId: active.id } }), 1);
    assert.equal(await prisma.crmActivity.count({ where: { OR: [{ scopeOrgId: due.id }, { customerOrgId: due.id }] } }), 0);
    assert.equal(await prisma.crmActivity.count({ where: { OR: [{ scopeOrgId: active.id }, { customerOrgId: active.id }] } }), 2);
    assert.equal((await prisma.onboardingRequest.findUniqueOrThrow({ where: { id: salesLead.id } })).customerOrgId, null);
    assert.equal(await prisma.crmActivity.count({ where: { leadId: salesLead.id } }), 1);
  } finally {
    // Exercise the same dependency-safe purge for fixture cleanup.
    for (const org of orgs) {
      if (!await prisma.organization.count({ where: { id: org.id } })) continue;
      await prisma.organization.update({ where: { id: org.id }, data: { deletedAt: old, status: "DISABLED" } });
      await prisma.auditLog.create({ data: { orgId: org.id, actorUserId: user.id, action: "ORGANIZATION_DELETE_REQUESTED", entityType: "Organization", entityId: org.id, createdAt: old } });
      await purgeOrganization(prisma, org.id, now);
    }
    if (salesLeadId) await prisma.onboardingRequest.deleteMany({ where: { id: salesLeadId } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
});

test("retention cleans files in resumable batches and never drops an uncleaned reference", { skip: !databaseUrl }, async () => {
  const { prisma } = await import("../../apps/web/src/lib/prisma");
  const { purgeOrganization } = await import("../../apps/web/src/lib/data-retention/organization-deletion");
  const { cleanOrganizationFiles } = await import("../../apps/web/src/lib/data-retention/organization-files");
  const { mkdtemp, mkdir, writeFile, access, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const path = await import("node:path");
  const directory = await mkdtemp(path.join(tmpdir(), "estatedesk-retention-files-"));
  const previous = process.env.PRIVATE_PROOF_DIR;
  process.env.PRIVATE_PROOF_DIR = directory;
  const user = await prisma.user.create({ data: { fullName: "File retention fixture", passwordHash: "test-only" } });
  const old = new Date(Date.now() - 31 * 86400000);
  const org = await prisma.organization.create({ data: { name: "File retention", slug: `file-retention-${randomUUID()}`, deletedAt: old, status: "DISABLED" } });
  try {
    await prisma.auditLog.create({ data: { orgId: org.id, actorUserId: user.id, action: "ORGANIZATION_DELETE_REQUESTED", entityType: "Organization", entityId: org.id, createdAt: old } });
    await mkdir(path.join(directory, org.id));
    for (let i = 0; i < 21; i++) {
      const objectKey = `${org.id}/${i}.png`;
      await writeFile(path.join(directory, objectKey), "synthetic test file");
      await prisma.asset.create({ data: { orgId: org.id, uploadedByUserId: user.id, key: `/api/test/${i}`, fileName: `${i}.png`, fileType: "image", size: 19, metadata: { purpose: "move_out_refund_proof", storage: "local-private", objectKey } } });
    }
    await assert.rejects(purgeOrganization(prisma, org.id), /files must be removed/);
    assert.equal(await prisma.asset.count({ where: { orgId: org.id } }), 21);
    assert.equal(await cleanOrganizationFiles(prisma, org.id), false);
    await assert.rejects(purgeOrganization(prisma, org.id), /files must be removed/);
    assert.equal(await cleanOrganizationFiles(prisma, org.id), true);
    for (let i = 0; i < 21; i++) await assert.rejects(access(path.join(directory, org.id, `${i}.png`)));
    assert.equal(await purgeOrganization(prisma, org.id), true);
    assert.equal(await prisma.user.count({ where: { id: user.id } }), 1);
  } finally {
    if (await prisma.organization.count({ where: { id: org.id } })) {
      await cleanOrganizationFiles(prisma, org.id);
      await cleanOrganizationFiles(prisma, org.id);
      await purgeOrganization(prisma, org.id);
    }
    await prisma.user.delete({ where: { id: user.id } });
    if (previous === undefined) delete process.env.PRIVATE_PROOF_DIR; else process.env.PRIVATE_PROOF_DIR = previous;
    await rm(directory, { recursive: true, force: true });
    await prisma.$disconnect();
  }
});
