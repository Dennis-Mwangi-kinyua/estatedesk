import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { configureTestDatabase } from "./database-safety";
import type { AppSession } from "../../apps/web/src/lib/auth/session";

const databaseUrl = configureTestDatabase();
test("Today isolates personal work, recipient messages and organizations, and never completes work on reads", { skip: !databaseUrl }, async () => {
  const { prisma } = await import("../../apps/web/src/lib/prisma");
  const { getTodaySummary } = await import("../../apps/web/src/features/today/service");
  const { todaySummarySchema } = await import("../../packages/contracts/src/mobile");
  const tag = randomUUID();
  const user = await prisma.user.create({ data: { fullName: "Today office user", passwordHash: "fixture-only", termsAcceptedAt: new Date() } });
  const other = await prisma.user.create({ data: { fullName: "Other Today user", passwordHash: "fixture-only" } });
  const org = await prisma.organization.create({ data: { name: "Today organization", slug: `today-${tag}` } });
  const foreign = await prisma.organization.create({ data: { name: "Foreign organization", slug: `today-foreign-${tag}` } });
  const session: AppSession = { userId: user.id, fullName: user.fullName, email: null, platformRole: "USER", activeOrgId: org.id, activeOrgRole: "OFFICE", membershipScope: { scopeType: "PROPERTY", scopeId: "unassigned-property" }, mustChangePassword: false, requiresTermsAcceptance: false };
  try {
    const a = await prisma.tenant.create({ data: { orgId: org.id, fullName: "Own customer", phone: "0700000000" } });
    const b = await prisma.tenant.create({ data: { orgId: foreign.id, fullName: "Foreign customer", phone: "0700000001" } });
    const activity = (scopeOrgId: string, tenantId: string, assigneeId: string, body: string) => prisma.crmActivity.create({ data: { scopeOrgId, tenantId, assigneeId, authorId: user.id, body, kind: "TASK", dueAt: new Date("2026-11-09T10:00:00Z") } });
    const own = await activity(org.id, a.id, user.id, "Call my customer");
    await activity(org.id, a.id, other.id, "Other person's follow-up");
    await activity(foreign.id, b.id, user.id, "Foreign organization follow-up");
    const message = await prisma.notification.create({ data: { orgId: org.id, userId: user.id, channel: "IN_APP", status: "SENT", type: "GENERAL", title: "Personal message", message: "Own recipient content" } });
    await prisma.notification.create({ data: { orgId: org.id, userId: other.id, channel: "IN_APP", status: "SENT", type: "GENERAL", title: "Private other message", message: "Do not disclose" } });
    await prisma.notification.create({ data: { orgId: foreign.id, userId: user.id, channel: "IN_APP", status: "SENT", type: "GENERAL", title: "Foreign message", message: "Do not disclose" } });
    const now = new Date("2026-11-10T09:00:00Z");
    const scoped = todaySummarySchema.parse(await getTodaySummary(session, now));
    assert.deepEqual(scoped.sections.find(section => section.id === "tasks")?.items ?? [], [], "Property scope cannot expose other property customer records");
    assert.deepEqual(scoped.sections.find(section => section.id === "messages")?.items.map(item => item.title), ["Personal message"]);
    const wide = await getTodaySummary({ ...session, membershipScope: { scopeType: "ORG", scopeId: org.id } }, now);
    assert.deepEqual(wide.sections.find(section => section.id === "tasks")?.items.map(item => item.title), ["Call my customer"]);
    assert.equal(wide.sections.find(section => section.id === "tasks")?.items[0].urgency, "overdue");
    assert.equal((await prisma.crmActivity.findUniqueOrThrow({ where: { id: own.id } })).completedAt, null);
    assert.equal((await prisma.notification.findUniqueOrThrow({ where: { id: message.id } })).readAt, null);
    const switched = await getTodaySummary({ ...session, activeOrgId: foreign.id, membershipScope: { scopeType: "ORG", scopeId: foreign.id } }, now);
    assert.deepEqual(switched.sections.find(section => section.id === "tasks")?.items.map(item => item.title), ["Foreign organization follow-up"]);
    const blocked = await getTodaySummary({ ...session, mustChangePassword: true }, now);
    assert.deepEqual(blocked.sections, []);
    await prisma.crmActivity.create({ data: { customerOrgId: foreign.id, authorId: user.id, assigneeId: user.id, kind: "TASK", body: "Archived customer follow-up", dueAt: now } });
    await prisma.organization.update({ where: { id: foreign.id }, data: { deletedAt: now } });
    const platformToday = await getTodaySummary({ ...session, platformRole: "PLATFORM_ADMIN", activeOrgId: null, activeOrgRole: null, membershipScope: null }, now);
    assert.deepEqual(platformToday.sections.find(section => section.id === "tasks")?.items ?? [], []);
  } finally {
    await prisma.organization.deleteMany({ where: { id: { in: [org.id, foreign.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [user.id, other.id] } } });
    await prisma.$disconnect();
  }
});

test("Today bills and maintenance belong to the current tenant, and provider jobs belong to their owner", { skip: !databaseUrl }, async () => {
  const { prisma } = await import("../../apps/web/src/lib/prisma");
  const { getTodaySummary } = await import("../../apps/web/src/features/today/service");
  const tag = randomUUID();
  const user = await prisma.user.create({ data: { fullName: "Today tenant", passwordHash: "fixture-only" } });
  const other = await prisma.user.create({ data: { fullName: "Another owner", passwordHash: "fixture-only" } });
  const org = await prisma.organization.create({ data: { name: "Tenant Today", slug: `tenant-today-${tag}` } });
  const now = new Date("2026-11-10T09:00:00Z");
  const session: AppSession = { userId: user.id, fullName: user.fullName, email: null, platformRole: "USER", activeOrgId: org.id, activeOrgRole: "TENANT", membershipScope: { scopeType: "ORG", scopeId: org.id }, mustChangePassword: false, requiresTermsAcceptance: false };
  try {
    const property = await prisma.property.create({ data: { orgId: org.id, name: "Today property" } });
    const unit = await prisma.unit.create({ data: { propertyId: property.id, houseNo: "A1", rentAmount: 100 } });
    const tenant = await prisma.tenant.create({ data: { orgId: org.id, userId: user.id, fullName: "Current tenant", phone: "0700000000" } });
    const lease = await prisma.lease.create({ data: { orgId: org.id, tenantId: tenant.id, unitId: unit.id, monthlyRent: 100, startDate: new Date("2026-10-01") } });
    await prisma.rentCharge.create({ data: { orgId: org.id, leaseId: lease.id, period: "2026-11", chargeType: "RENT", amountDue: 100, amountPaid: 0, balance: 100, dueDate: new Date("2026-11-10T00:00:00Z") } });
    await prisma.issueTicket.create({ data: { orgId: org.id, unitId: unit.id, reportedByUserId: user.id, title: "My maintenance request", description: "Own issue" } });
    await prisma.issueTicket.create({ data: { orgId: org.id, unitId: unit.id, reportedByUserId: other.id, title: "Someone else's request", description: "Private issue" } });
    const tenantToday = await getTodaySummary(session, now);
    assert.ok(tenantToday.sections.find(section => section.id === "payments")?.items.some(item => item.urgency === "today"));
    assert.deepEqual(tenantToday.sections.find(section => section.id === "work")?.items.map(item => item.title), ["My maintenance request"]);
    await prisma.lease.update({ where: { id: lease.id }, data: { status: "TERMINATED" } });
    const inactive = await getTodaySummary(session, now);
    assert.equal(inactive.sections.some(section => ["payments", "work"].includes(section.id)), false);
    const provider = await prisma.serviceProvider.create({ data: { userId: user.id, businessName: "Own provider", category: "Plumbing", location: "Nairobi", bio: "Fixture" } });
    const foreignProvider = await prisma.serviceProvider.create({ data: { userId: other.id, businessName: "Other provider", category: "Plumbing", location: "Nairobi", bio: "Fixture" } });
    await prisma.serviceJob.createMany({ data: [{ orgId: org.id, providerId: provider.id, title: "My assigned repair", category: "Plumbing", location: "Nairobi", description: "Own job", status: "ASSIGNED" }, { orgId: org.id, providerId: foreignProvider.id, title: "Another provider's repair", category: "Plumbing", location: "Nairobi", description: "Foreign job", status: "ASSIGNED" }] });
    const providerToday = await getTodaySummary({ ...session, activeOrgId: null, activeOrgRole: null, membershipScope: null }, now);
    assert.deepEqual(providerToday.sections.find(section => section.id === "work")?.items.map(item => item.title), ["My assigned repair"]);
  } finally {
    await prisma.organization.delete({ where: { id: org.id } });
    await prisma.serviceProvider.deleteMany({ where: { userId: { in: [user.id, other.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [user.id, other.id] } } });
    await prisma.$disconnect();
  }
});
