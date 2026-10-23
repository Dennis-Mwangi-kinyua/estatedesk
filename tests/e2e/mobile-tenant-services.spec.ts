import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { test, expect } from "playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { configureTestDatabase } from "../integration/database-safety";

test.beforeEach(({}, info) => test.skip(!process.env.ROLE_WORKSPACE_FIXTURE || info.project.name !== "chromium", "Requires fictional local accounts"));
test("native community, expenses and profile preserve tenant ownership", async ({ request }) => {
  const fixture = JSON.parse(await readFile(process.env.ROLE_WORKSPACE_FIXTURE!, "utf8"));
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: configureTestDatabase()! }) });
  const tag = `native-service-${randomUUID()}`;
  let noticeId: string | undefined;
  try {
    const lease = await db.lease.findFirstOrThrow({ where: { orgId: fixture.orgId, tenant: { userId: fixture.accounts.TENANT.id }, status: "ACTIVE" }, include: { unit: true } });
    const base = { "X-EstateDesk-Client": "native", "X-EstateDesk-Capabilities": "2026-10-18" };
    const login = await request.post("/api/mobile/login", { headers: base, data: { email: fixture.accounts.TENANT.email, password: fixture.accounts.TENANT.password } });
    expect(login.status()).toBe(200);
    const headers = { ...base, Cookie: (await login.json()).sessionCookie };
    for (const section of ["community", "expenditures", "profile"]) {
      // Playwright retains Set-Cookie from login; native fetch uses credentials: omit.
      expect((await request.get(`/api/mobile/tenant/${section}`, { headers: { ...base, Cookie: "" } })).status()).toBe(401);
      expect((await request.get(`/api/mobile/tenant/${section}`, { headers: { ...headers, Origin: "https://external.test" } })).status()).toBe(403);
    }
    const notice = await db.communityNotice.create({ data: { orgId: fixture.orgId, propertyId: lease.unit.propertyId, title: tag, message: "Fictional notice", publishedByUserId: fixture.accounts.MANAGER.id } });
    noticeId = notice.id;
    const own = await db.communityNoticeRecipient.create({ data: { noticeId, tenantId: lease.tenantId, recipientKey: tag } });
    const foreign = await db.communityNoticeRecipient.create({ data: { noticeId, tenantId: `other-${tag}`, recipientKey: `other-${tag}` } });
    const board = await request.get("/api/mobile/tenant/community", { headers });
    expect(board.status()).toBe(200);
    const rows = await board.json(); expect(rows.some((item: { id: string }) => item.id === own.id)).toBe(true); expect(rows.some((item: { id: string }) => item.id === foreign.id)).toBe(false);
    expect((await request.post("/api/mobile/tenant/community", { headers, data: { id: own.id } })).status()).toBe(200);
    await request.post("/api/mobile/tenant/community", { headers, data: { id: foreign.id } });
    expect((await db.communityNoticeRecipient.findUniqueOrThrow({ where: { id: foreign.id } })).readAt).toBeNull();
    expect((await db.communityNoticeRecipient.findUniqueOrThrow({ where: { id: own.id } })).readAt).not.toBeNull();
    const expense = { description: tag, amount: 120.50, incurredAt: "2026-10-18", category: "TENANT_REPAIR", tenantId: "foreign-tenant", orgId: "foreign-org" };
    expect((await request.post("/api/mobile/tenant/expenditures", { headers, data: { ...expense, incurredAt: "2026-02-30" } })).status()).toBe(400);
    expect((await request.post("/api/mobile/tenant/expenditures", { headers, data: expense })).status()).toBe(200);
    const recorded = await db.expenditure.findFirstOrThrow({ where: { description: tag } });
    expect(recorded.tenantId).toBe(lease.tenantId); expect(recorded.orgId).toBe(fixture.orgId); expect(recorded.status).toBe("RECORDED");
    const profile = await request.get("/api/mobile/tenant/profile", { headers }); expect(profile.status()).toBe(200); expect((await profile.json()).fullName).toBeTruthy();
  } finally {
    await db.expenditure.deleteMany({ where: { description: tag } });
    if (noticeId) await db.communityNotice.deleteMany({ where: { id: noticeId } });
    await db.$disconnect();
  }
});
