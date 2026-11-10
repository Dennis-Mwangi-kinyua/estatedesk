import { createHash, randomBytes, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { expect, test } from "playwright/test";
import { configureTestDatabase } from "../integration/database-safety";
import { todaySummarySchema } from "../../packages/contracts/src/mobile";

test("Today shares scoped personal work with native clients, filters overdue tasks, and confirms message reads", async ({ page, context, request, baseURL }) => {
  const databaseUrl = configureTestDatabase();
  test.skip(!databaseUrl, "Requires an explicitly configured disposable local test database");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl! }) });
  const tag = randomUUID();
  const user = await db.user.create({ data: { fullName: "Today office user", passwordHash: "fixture-only", termsAcceptedAt: new Date() } });
  const other = await db.user.create({ data: { fullName: "Today other user", passwordHash: "fixture-only" } });
  const org = await db.organization.create({ data: { name: `Today workspace ${tag}`, slug: `today-browser-${tag}`, subscription: { create: { plan: "FREE", status: "ACTIVE", currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 86400000 * 30) } } } });
  const membership = await db.membership.create({ data: { orgId: org.id, userId: user.id, role: "OFFICE", scopeType: "ORG", scopeId: org.id } });
  try {
    const tenant = await db.tenant.create({ data: { orgId: org.id, fullName: "Today customer", phone: "0700000000" } });
    const task = await db.crmActivity.create({ data: { scopeOrgId: org.id, tenantId: tenant.id, assigneeId: user.id, authorId: user.id, kind: "TASK", body: "Call this customer today", dueAt: new Date(Date.now() - 86400000) } });
    await db.crmActivity.create({ data: { scopeOrgId: org.id, tenantId: tenant.id, assigneeId: other.id, authorId: user.id, kind: "TASK", body: "Another user's private follow-up", dueAt: new Date() } });
    const message = await db.notification.create({ data: { orgId: org.id, userId: user.id, title: "Message for your attention", message: "Please review the customer's question.", channel: "IN_APP", status: "SENT", type: "GENERAL" } });
    const privateMessage = await db.notification.create({ data: { orgId: org.id, userId: other.id, title: "Another user's message", message: "Private recipient", channel: "IN_APP", status: "SENT", type: "GENERAL" } });
    const token = randomBytes(32).toString("hex");
    await db.userSession.create({ data: { userId: user.id, activeMembershipId: membership.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 3600000) } });
    const cookieName = process.env.TEST_SESSION_COOKIE_NAME ?? "estatedesk_session";
    const native = { "X-EstateDesk-Client": "native", Cookie: `${cookieName}=${token}` };
    expect((await request.get("/api/mobile/today")).status()).toBe(401);
    expect((await request.get("/api/mobile/today", { headers: { Cookie: `${cookieName}=${token}` } })).status()).toBe(403);
    expect((await request.get("/api/mobile/today", { headers: { "X-EstateDesk-Client": "native" } })).status()).toBe(401);
    const csrf = await request.post("/api/notifications/read", { headers: { Cookie: native.Cookie, Origin: "https://external.example", "Sec-Fetch-Site": "cross-site" }, data: { id: message.id } });
    expect(csrf.status()).toBe(403);
    const foreignRead = await request.post("/api/notifications/read", { headers: { Cookie: native.Cookie, Origin: baseURL!, "Sec-Fetch-Site": "same-origin" }, data: { id: privateMessage.id } });
    expect(foreignRead.status()).toBe(403);
    expect((await db.notification.findUniqueOrThrow({ where: { id: privateMessage.id } })).readAt).toBeNull();
    const response = await request.get("/api/mobile/today?userId=someone-else", { headers: native });
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("no-store");
    const summary = todaySummarySchema.parse(await response.json());
    expect(summary.sections.find(section => section.id === "tasks")?.items.map(item => item.title)).toEqual(["Call this customer today"]);
    expect(summary.sections.find(section => section.id === "tasks")?.items[0].native?.path).toBe("/dashboard/org/crm/tasks");
    expect((await db.crmActivity.findUniqueOrThrow({ where: { id: task.id } })).completedAt).toBeNull();
    expect((await db.notification.findUniqueOrThrow({ where: { id: message.id } })).readAt).toBeNull();
    await context.addCookies([{ name: cookieName, value: token, url: baseURL!, secure: cookieName.startsWith("__Host-"), httpOnly: true }]);
    for (const width of [320, 768]) {
      await page.setViewportSize({ width, height: 640 });
      await page.goto("/dashboard/today");
      await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible();
      await expect(page.getByText("Call this customer today", { exact: true })).toBeVisible();
      await expect(page.getByText("Another user's private follow-up", { exact: true })).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/dashboard/org");
    const menu = await page.getByRole("button", { name: "Open navigation", exact: true }).boundingBox();
    const profile = await page.getByRole("link", { name: "My profile", exact: true }).boundingBox();
    expect(profile!.x + profile!.width).toBeLessThanOrEqual(320);
    const search = await page.getByRole("link", { name: "Search organisation", exact: true }).boundingBox();
    expect(menu!.x + menu!.width).toBeLessThanOrEqual(search!.x);
    const updates = page.getByRole("button", { name: "Close what’s new", exact: true });
    if (await updates.waitFor({ state: "visible", timeout: 5000 }).then(() => true, () => false)) await updates.click();
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    await page.getByRole("link", { name: "Today", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Overdue", exact: true }).click();
    await expect(page.getByText("Call this customer today", { exact: true })).toBeVisible();
    await expect(page.getByText("Message for your attention", { exact: true })).toHaveCount(0);
    await page.getByRole("link", { name: "Messages", exact: true }).click();
    await expect(page.getByText("Message for your attention", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Mark as read", exact: true }).click();
    await expect.poll(async () => (await db.notification.findUniqueOrThrow({ where: { id: message.id } })).readAt).not.toBeNull();
    await expect(page.getByText("Message for your attention", { exact: true })).toHaveCount(0);
  } finally {
    await db.organization.delete({ where: { id: org.id } });
    await db.userSession.deleteMany({ where: { userId: user.id } });
    await db.user.deleteMany({ where: { id: { in: [user.id, other.id] } } });
    await db.$disconnect();
  }
});
