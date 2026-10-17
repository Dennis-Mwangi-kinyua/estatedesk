import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test, expect, type APIRequestContext } from "playwright/test";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { configureTestDatabase } from "../integration/database-safety";

test.beforeEach(({}, info) => { test.skip(!process.env.ROLE_WORKSPACE_FIXTURE || info.project.name !== "chromium", "Uses fictional local accounts and mutates once"); });
const native = { "X-EstateDesk-Client": "native" };
async function login(request: APIRequestContext, account: { email: string; password: string }) {
  const response = await request.post("/api/mobile/login", { headers: native, data: account });
  expect(response.status(), await response.text()).toBe(200);
  return { ...native, Cookie: (await response.json()).sessionCookie as string };
}

test("native tenancy, work orders and staff portfolio keep account and assignment boundaries", async ({ request }) => {
  test.setTimeout(120000);
  const f = JSON.parse(await readFile(process.env.ROLE_WORKSPACE_FIXTURE!, "utf8"));
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: configureTestDatabase()! }) });
  const tenant = await db.tenant.findFirstOrThrow({ where: { orgId: f.orgId, userId: f.accounts.TENANT.id } });
  const lease = await db.lease.findFirstOrThrow({ where: { tenantId: tenant.id, orgId: f.orgId } });
  const originalScope = await db.membership.findFirstOrThrow({ where: { userId: f.accounts.OFFICE.id, orgId: f.orgId } });
  const originalSettings = await db.organizationSettings.findUnique({ where: { orgId: f.orgId } });
  const unique = randomUUID();
  const foreignOrg = await db.organization.create({ data: { name: "Mobile isolation", slug: `mobile-${unique}` } });
  const foreignProperty = await db.property.create({ data: { orgId: foreignOrg.id, name: "Private foreign property" } });
  const foreignUnit = await db.unit.create({ data: { propertyId: foreignProperty.id, houseNo: "Private foreign unit", rentAmount: 999 } });
  const foreignTenant = await db.tenant.create({ data: { orgId: foreignOrg.id, userId: f.accounts.TENANT.id, fullName: "Same user in a different org", phone: `foreign-${unique}` } });
  const foreignLease = await db.lease.create({ data: { orgId: foreignOrg.id, unitId: foreignUnit.id, tenantId: foreignTenant.id, startDate: new Date(), monthlyRent: 999 } });
  const otherTenant = await db.tenant.create({ data: { orgId: f.orgId, fullName: "Another tenant", phone: `other-${unique}` } });
  const property = await db.property.findFirstOrThrow({ where: { orgId: f.orgId } });
  const otherUnit = await db.unit.create({ data: { propertyId: property.id, houseNo: `Other-${unique}`, rentAmount: 777 } });
  const otherLease = await db.lease.create({ data: { orgId: f.orgId, unitId: otherUnit.id, tenantId: otherTenant.id, startDate: new Date(), monthlyRent: 777 } });
  const issue = await db.issueTicket.create({ data: { orgId: f.orgId, unitId: lease.unitId, reportedByUserId: f.accounts.TENANT.id, title: `Tap-${unique}`, description: "Leaking tap in assigned unit", priority: "HIGH" } });
  const outOfScope = await db.issueTicket.create({ data: { orgId: f.orgId, unitId: otherUnit.id, reportedByUserId: f.accounts.TENANT.id, title: "Unassigned unit issue", description: "Should not be visible" } });
  const foreignIssue = await db.issueTicket.create({ data: { orgId: foreignOrg.id, unitId: foreignUnit.id, reportedByUserId: f.accounts.TENANT.id, title: "Foreign issue", description: "Should not be visible" } });
  let assignmentId = "";
  const noticeIds: string[] = [];
  try {
    for (const [leaseId, tenantId] of [[lease.id, tenant.id], [otherLease.id, otherTenant.id], [foreignLease.id, foreignTenant.id]]) {
      const notice = await db.moveOutNotice.create({ data: { leaseId, tenantId, referenceCode: randomUUID(), moveOutDate: new Date() } }); noticeIds.push(notice.id);
    }
    const headers = await login(request, f.accounts.TENANT);
    expect((await request.get("/api/mobile/tenant/leases", { headers: { ...headers, Origin: "https://example.test" } })).status()).toBe(403);
    const ownLeases = await (await request.get("/api/mobile/tenant/leases", { headers })).json();
    expect(ownLeases.some((item: { id: string }) => item.id === lease.id)).toBe(true);
    expect(ownLeases.some((item: { id: string }) => [foreignLease.id, otherLease.id].includes(item.id))).toBe(false);
    const notices = await (await request.get("/api/mobile/tenant/move-outs", { headers })).json();
    expect(notices.some((item: { id: string }) => item.id === noticeIds[0])).toBe(true);
    expect(notices.some((item: { id: string }) => noticeIds.slice(1).includes(item.id))).toBe(false);
    expect((await request.get("/api/mobile/org/units", { headers })).status()).toBe(403);
    expect((await request.get("/api/mobile/caretaker/issues", { headers })).status()).toBe(403);

    const assignment = await db.caretakerAssignment.create({ data: { orgId: f.orgId, caretakerUserId: f.accounts.CARETAKER.id, unitId: lease.unitId } }); assignmentId = assignment.id;
    const caretaker = await login(request, f.accounts.CARETAKER);
    const work = await (await request.get("/api/mobile/caretaker/issues", { headers: caretaker })).json();
    expect(work.some((item: { id: string; canStart: boolean }) => item.id === issue.id && item.canStart)).toBe(true);
    expect(work.some((item: { id: string }) => [foreignIssue.id, outOfScope.id].includes(item.id))).toBe(false);
    for (const id of [outOfScope.id, foreignIssue.id]) expect((await request.post("/api/mobile/caretaker/issues", { headers: caretaker, data: { action: "start", issueId: id } })).status()).toBe(404);
    const started = await request.post("/api/mobile/caretaker/issues", { headers: caretaker, data: { action: "start", issueId: issue.id } }); expect(started.status(), await started.text()).toBe(200);
    expect((await db.issueTicket.findUniqueOrThrow({ where: { id: issue.id } })).assignedToUserId).toBe(f.accounts.CARETAKER.id);
    expect((await request.post("/api/mobile/caretaker/issues", { headers: caretaker, data: { action: "start", issueId: issue.id } })).status()).toBe(409);
    expect((await request.post("/api/mobile/caretaker/issues", { headers: caretaker, data: { action: "note", issueId: issue.id, progressNote: "Replacement tap sourced." } })).status()).toBe(200);
    expect((await db.issueTicket.findUniqueOrThrow({ where: { id: issue.id } })).resolutionNotes).toContain("Replacement tap sourced.");
    const completion = { action: "complete", issueId: issue.id, workSummary: "Replaced tap and tested for leaks.", materialsUsed: "One tap", tenantInstructions: "Check for any drips." };
    const completed = await request.post("/api/mobile/caretaker/issues", { headers: caretaker, data: completion }); expect(completed.status(), await completed.text()).toBe(200);
    expect((await db.issueTicket.findUniqueOrThrow({ where: { id: issue.id } })).status).toBe("IN_PROGRESS");
    expect((await db.issueResolutionReport.findFirstOrThrow({ where: { issueId: issue.id } })).status).toBe("SUBMITTED");
    expect((await request.post("/api/mobile/caretaker/issues", { headers: caretaker, data: completion })).status()).toBe(409);

    await db.membership.update({ where: { id: originalScope.id }, data: { scopeType: "UNIT", scopeId: lease.unitId } });
    const staff = await login(request, f.accounts.OFFICE);
    const units = await (await request.get("/api/mobile/org/units", { headers: staff })).json();
    expect(units.total).toBe(1); expect(units.units[0].id).toBe(lease.unitId);
    const invalid = await request.get("/api/mobile/org/units?page=-1", { headers: staff }); expect(invalid.status()).toBe(400);
    const empty = await (await request.get(`/api/mobile/org/units?q=${encodeURIComponent(otherUnit.houseNo)}`, { headers: staff })).json(); expect(empty.total).toBe(0);
    await db.organizationSettings.upsert({ where: { orgId: f.orgId }, create: { orgId: f.orgId, roleAccess: { OFFICE: { permissions: {}, blockedViews: ["properties"] } } }, update: { roleAccess: { OFFICE: { permissions: {}, blockedViews: ["properties"] } } } });
    const summary = await (await request.get("/api/mobile/session", { headers: staff })).json(); expect(summary.features).not.toContain("portfolio");
    expect([401, 403]).toContain((await request.get("/api/mobile/org/units", { headers: staff })).status());
  } finally {
    await db.organizationSettings.update({ where: { orgId: f.orgId }, data: { roleAccess: originalSettings?.roleAccess ?? Prisma.DbNull } });
    await db.membership.update({ where: { id: originalScope.id }, data: { scopeType: originalScope.scopeType, scopeId: originalScope.scopeId } });
    if (assignmentId) await db.caretakerAssignment.delete({ where: { id: assignmentId } });
    await db.issueResolutionReport.deleteMany({ where: { issueId: issue.id } });
    await db.issueTicket.deleteMany({ where: { id: { in: [issue.id, outOfScope.id, foreignIssue.id] } } });
    await db.moveOutNotice.deleteMany({ where: { id: { in: noticeIds } } });
    await db.lease.deleteMany({ where: { id: { in: [otherLease.id, foreignLease.id] } } });
    await db.tenant.deleteMany({ where: { id: { in: [otherTenant.id, foreignTenant.id] } } });
    await db.unit.deleteMany({ where: { id: { in: [otherUnit.id, foreignUnit.id] } } });
    await db.property.delete({ where: { id: foreignProperty.id } });
    await db.organization.delete({ where: { id: foreignOrg.id } });
    await db.$disconnect();
  }
});

test("native portfolio search paginates without duplicates and excludes deleted units", async ({ request }) => {
  const f = JSON.parse(await readFile(process.env.ROLE_WORKSPACE_FIXTURE!, "utf8"));
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: configureTestDatabase()! }) });
  const property = await db.property.findFirstOrThrow({ where: { orgId: f.orgId } });
  const prefix = `Mobile-page-${randomUUID()}`;
  try {
    await db.unit.createMany({ data: Array.from({ length: 27 }, (_, index) => ({ propertyId: property.id, houseNo: `${prefix}-${String(index).padStart(2, "0")}`, rentAmount: 500, status: index % 2 ? "OCCUPIED" as const : "VACANT" as const, deletedAt: index === 26 ? new Date() : null })) });
    const headers = await login(request, f.accounts.MANAGER);
    const base = `/api/mobile/org/units?q=${encodeURIComponent(prefix)}`;
    const first = await (await request.get(base, { headers })).json();
    const second = await (await request.get(`${base}&page=2`, { headers })).json();
    expect(first.total).toBe(26); expect(first.units).toHaveLength(25); expect(second.units).toHaveLength(1);
    expect(first.totalPages).toBe(2);
    expect(first.units.some((unit: { id: string }) => unit.id === second.units[0].id)).toBe(false);
    const vacant = await (await request.get(`${base}&status=VACANT`, { headers })).json();
    expect(vacant.total).toBe(13); expect(vacant.units.every((unit: { status: string }) => unit.status === "VACANT")).toBe(true);
  } finally {
    await db.unit.deleteMany({ where: { propertyId: property.id, houseNo: { startsWith: prefix } } });
    await db.$disconnect();
  }
});
