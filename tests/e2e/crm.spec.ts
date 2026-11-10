import { createHash, randomBytes, randomUUID } from "node:crypto";
import { test, expect } from "playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { configureTestDatabase } from "../integration/database-safety";

test.use({ actionTimeout: 15000, navigationTimeout: 30000 });

test("CRM sales demos, customer portal communication, tasks, and reports work in both workspaces", async ({ page, context, baseURL }, testInfo) => {
  const databaseUrl = configureTestDatabase(); test.skip(!databaseUrl, "Requires a migrated disposable local test database");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl! }) }); const tag = randomUUID();
  const platform = await db.user.create({ data: { fullName: "CRM sales admin", passwordHash: "test-only", platformRole: "PLATFORM_ADMIN", termsAcceptedAt: new Date() } });
  const staff = await db.user.create({ data: { fullName: "CRM office admin", passwordHash: "test-only", termsAcceptedAt: new Date() } });
  const customerUser = await db.user.create({ data: { fullName: "CRM portal customer", passwordHash: "test-only", termsAcceptedAt: new Date() } });
  const org = await db.organization.create({ data: { name: `CRM organization ${tag}`, slug: `crm-e2e-${tag}`, email: "customer@example.invalid", subscription: { create: { plan: "FREE", status: "ACTIVE", currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 86400000 * 365) } } } });
  const membership = await db.membership.create({ data: { orgId: org.id, userId: staff.id, role: "ADMIN", scopeType: "ORG", scopeId: org.id } });
  const tenant = await db.tenant.create({ data: { orgId: org.id, userId: customerUser.id, fullName: `CRM customer ${tag}`, phone: "0700000000", email: "tenant@example.invalid" } });
  const lead = await db.onboardingRequest.create({ data: { companyName: `CRM prospect ${tag}`, fullName: "Jane Contact", workEmail: "jane@example.invalid", managedPropertyType: "Residential", salesOwnerId: platform.id } });
  const login = async (userId: string, activeMembershipId?: string) => {
    const token = randomBytes(32).toString("hex"); await db.userSession.create({ data: { userId, activeMembershipId, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 3600000) } });
    const name = process.env.TEST_SESSION_COOKIE_NAME ?? "estatedesk_session";
    await context.clearCookies();
    if (name.startsWith("__Host-") && !baseURL!.startsWith("https:")) {
      throw new Error("Production browser sessions require an HTTPS test origin. Use the development server for HTTP browser checks.");
    }
    await context.addCookies([{ name, value: token, url: baseURL!, secure: name.startsWith("__Host-"), httpOnly: true, sameSite: "Strict" }]);
  };
  try {
    await login(platform.id);
    await page.goto("/platform/crm", { waitUntil: "commit" }); await expect(page.getByRole("heading", { name: "Sales CRM", exact: true })).toBeVisible();
    const closeUpdates = page.getByRole("button", { name: "Close what’s new", exact: true });
    if (await closeUpdates.waitFor({ state: "visible", timeout: 5000 }).then(() => true, () => false)) {
      await closeUpdates.click();
      await expect(page.locator("[data-product-updates]")).toHaveCount(0);
    }
    await page.goto(`/platform/crm/${lead.id}`, { waitUntil: "commit" }); await expect(page.getByRole("heading", { name: lead.companyName, exact: true })).toBeVisible();
    await page.getByLabel("Stage", { exact: true }).selectOption("DEMO_SCHEDULED");
    await page.getByLabel("Demo appointment (East Africa Time)").fill("2026-12-01T14:30");
    await page.getByRole("button", { name: "Save deal", exact: true }).click();
    await expect.poll(async () => (await db.onboardingRequest.findUniqueOrThrow({ where: { id: lead.id } })).salesStage).toBe("DEMO_SCHEDULED");
    await page.goto("/platform/crm/tasks", { waitUntil: "commit" }); await expect(page.locator("li").filter({ has: page.getByRole("link", { name: lead.companyName, exact: true }) }).getByText("Scheduled sales demonstration", { exact: true })).toBeVisible();
    await page.goto("/platform/crm/reports", { waitUntil: "commit" }); await expect(page.getByRole("heading", { name: "CRM reports & analytics", exact: true })).toBeVisible();
    await page.goto(`/platform/crm/customers/${org.id}`, { waitUntil: "commit" }); await expect(page.getByRole("heading", { name: org.name, exact: true })).toBeVisible();
    await login(staff.id, membership.id);
    await page.goto(`/dashboard/org/crm/${tenant.id}`, { waitUntil: "commit" }); await expect(page.getByRole("heading", { name: tenant.fullName, exact: true })).toBeVisible();
    if (await page.locator("[data-product-updates]").count()) {
      await page.getByRole("button", { name: "Close what’s new", exact: true }).click();
      await expect(page.locator("[data-product-updates]")).toHaveCount(0);
    }
    const communication = page.locator("section").filter({ has: page.getByRole("heading", { name: "Customer communication", exact: true }) });
    await communication.getByLabel("Channel", { exact: true }).selectOption("IN_APP");
    await communication.getByLabel("Subject", { exact: true }).fill("Customer service check-in");
    await communication.getByLabel("Message", { exact: true }).fill("Please contact our office if you need help.");
    await communication.getByRole("button", { name: "Send message", exact: true }).click();
    await expect(communication.getByRole("status")).toHaveText("Message delivered to the customer portal.");
    expect(await db.notification.count({ where: { orgId: org.id, tenantId: tenant.id, title: "Customer service check-in", status: "SENT" } })).toBe(1);
    const activity = page.locator("section").filter({ has: page.getByRole("heading", { name: "Record an interaction or follow-up", exact: true }) });
    await activity.getByLabel("Activity type").selectOption("TASK"); await activity.getByLabel("Notes / next action").fill("Call about renewal");
    await activity.getByLabel("Due date (East Africa Time)").fill("2026-12-02T09:00"); await activity.getByLabel("Priority").selectOption("HIGH");
    await activity.getByLabel("Assigned to").selectOption(staff.id); await activity.getByRole("button", { name: "Add activity", exact: true }).click();
    await expect(activity.getByRole("status")).toHaveText("Activity recorded.");
    await page.goto("/dashboard/org/crm/tasks?mine=yes", { waitUntil: "commit" }); await expect(page.locator("p").filter({ hasText: /^Call about renewal$/ })).toBeVisible();
    await page.getByText("Edit task", { exact: true }).click();
    await page.getByLabel("Task", { exact: true }).fill("Call about renewal (updated)");
    await page.getByLabel("Due (East Africa Time)").fill("2026-12-03T11:00");
    await page.getByLabel("Priority", { exact: true }).selectOption("URGENT");
    await page.getByRole("button", { name: "Save task", exact: true }).click();
    await expect.poll(async () => (await db.crmActivity.findFirstOrThrow({ where: { tenantId: tenant.id, kind: "TASK" } })).priority).toBe("URGENT");
    await page.getByRole("button", { name: "Mark complete", exact: true }).click();
    await expect.poll(async () => db.crmActivity.count({ where: { tenantId: tenant.id, kind: "TASK", completedAt: { not: null } } })).toBe(1);
    await page.goto("/dashboard/org/crm/reports", { waitUntil: "commit" }); await expect(page.getByRole("heading", { name: "CRM reports & analytics", exact: true })).toBeVisible();
    const widths = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth })); expect(widths.content).toBeLessThanOrEqual(widths.viewport);
    await page.screenshot({ path: testInfo.outputPath("crm-reports.png"), fullPage: true });
  } finally {
    await db.onboardingRequest.delete({ where: { id: lead.id } }); await db.organization.delete({ where: { id: org.id } });
    await db.userSession.deleteMany({ where: { userId: { in: [platform.id, staff.id, customerUser.id] } } });
    await db.user.deleteMany({ where: { id: { in: [platform.id, staff.id, customerUser.id] } } }); await db.$disconnect();
  }
});
