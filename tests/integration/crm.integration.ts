import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { configureTestDatabase } from "./database-safety";
import { tenantCrmWhere } from "../../apps/web/src/features/crm/policy";

const databaseUrl = configureTestDatabase();
test("CRM persists incoming leads, isolates tenant activities, and prevents duplicate messages and stale deal writes", { skip: !databaseUrl }, async () => {
  const { prisma } = await import("../../apps/web/src/lib/prisma");
  const tag = randomUUID();
  const user = await prisma.user.create({ data: { fullName: "CRM integration admin", passwordHash: "test-only", platformRole: "PLATFORM_ADMIN" } });
  const orgA = await prisma.organization.create({ data: { name: "CRM customer A", slug: `crm-a-${tag}` } });
  const orgB = await prisma.organization.create({ data: { name: "CRM customer B", slug: `crm-b-${tag}` } });
  let leadId: string | undefined;
  try {
    const tenantA = await prisma.tenant.create({ data: { orgId: orgA.id, fullName: "Customer A", phone: "0700000000" } });
    const tenantB = await prisma.tenant.create({ data: { orgId: orgB.id, fullName: "Customer B", phone: "0700000001" } });
    const lead = await prisma.onboardingRequest.create({ data: { fullName: "Inbound contact", companyName: "Prospect", workEmail: "prospect@example.invalid", managedPropertyType: "Residential" } }); leadId = lead.id;
    assert.equal(lead.salesStage, "NEW");
    assert.equal(lead.salesOwnerId, null);
    const a = await prisma.crmActivity.create({ data: { tenantId: tenantA.id, scopeOrgId: orgA.id, authorId: user.id, body: "Private customer A note" } });
    await prisma.crmActivity.create({ data: { tenantId: tenantB.id, scopeOrgId: orgB.id, authorId: user.id, body: "Private customer B note" } });
    const visible = await prisma.crmActivity.findMany({ where: { scopeOrgId: orgA.id, tenant: tenantCrmWhere(orgA.id, { scopeType: "ORG", scopeId: orgA.id }) } });
    assert.deepEqual(visible.map(v => v.id), [a.id]);
    await assert.rejects(prisma.crmActivity.create({ data: { tenantId: tenantA.id, scopeOrgId: orgB.id, authorId: user.id, body: "Cross-org write" } }));
    await assert.rejects(prisma.crmActivity.create({ data: { leadId: lead.id, tenantId: tenantA.id, scopeOrgId: orgA.id, authorId: user.id, body: "Mixed platform and org record" } }));
    await assert.rejects(prisma.crmActivity.create({ data: { authorId: user.id, body: "Missing target" } }));
    const requestKey = randomUUID();
    await prisma.crmActivity.create({ data: { leadId: lead.id, authorId: user.id, kind: "EMAIL", body: "Email", requestKey, deliveryStatus: "ACCEPTED" } });
    await assert.rejects(prisma.crmActivity.create({ data: { leadId: lead.id, authorId: user.id, body: "Duplicate email", requestKey } }));
    const first = await prisma.onboardingRequest.updateMany({ where: { id: lead.id, updatedAt: lead.updatedAt }, data: { salesStage: "QUALIFIED", updatedAt: new Date(lead.updatedAt.getTime() + 1000) } });
    const stale = await prisma.onboardingRequest.updateMany({ where: { id: lead.id, updatedAt: lead.updatedAt }, data: { salesStage: "LOST" } });
    assert.equal(first.count, 1); assert.equal(stale.count, 0);
    const task = await prisma.crmActivity.create({ data: { customerOrgId: orgA.id, authorId: user.id, assigneeId: user.id, kind: "TASK", body: "Customer check-in", priority: "HIGH", dueAt: new Date(Date.now() - 60000) } });
    const overdue = await prisma.crmActivity.count({ where: { customerOrgId: orgA.id, completedAt: null, dueAt: { lt: new Date() } } }); assert.equal(overdue, 1);
    await prisma.crmActivity.update({ where: { id: task.id }, data: { completedAt: new Date() } });
    assert.equal(await prisma.crmActivity.count({ where: { customerOrgId: orgA.id, completedAt: null, dueAt: { lt: new Date() } } }), 0);
    await prisma.organization.delete({ where: { id: orgA.id } });
    assert.equal(await prisma.crmActivity.count({ where: { id: { in: [a.id, task.id] } } }), 0);
  } finally {
    if (leadId) await prisma.onboardingRequest.deleteMany({ where: { id: leadId } });
    await prisma.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
});


test("account deletion requests remain account-scoped when an organization is removed", { skip: !databaseUrl }, async () => {
  const { prisma } = await import("../../apps/web/src/lib/prisma");
  const { changeAccountDeletion, getAccountDeletion } = await import("../../apps/web/src/features/account-deletion/service");
  const user = await prisma.user.create({ data: { fullName: "Privacy retention account", passwordHash: "test-only" } });
  const org = await prisma.organization.create({ data: { name: "Privacy context", slug: `privacy-context-${randomUUID()}` } });
  try {
    await changeAccountDeletion(user.id, org.id, { action: "request", confirmation: "DELETE MY ACCOUNT" });
    const audit = await prisma.auditLog.findFirstOrThrow({ where: { entityType: "AccountDeletionRequest", entityId: user.id } });
    assert.equal(audit.orgId, null);
    await prisma.organization.delete({ where: { id: org.id } });
    assert.equal((await getAccountDeletion(user.id)).status, "REQUESTED");
    await changeAccountDeletion(user.id, null, { action: "withdraw" });
    assert.equal((await getAccountDeletion(user.id)).status, "WITHDRAWN");
  } finally {
    await prisma.auditLog.deleteMany({ where: { actorUserId: user.id } });
    await prisma.organization.deleteMany({ where: { id: org.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
});
