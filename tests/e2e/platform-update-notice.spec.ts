import { test, expect } from "playwright/test";
import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { configureTestDatabase } from "../integration/database-safety";
import { PRODUCT_UPDATES_DISMISSED_ID } from "../../apps/web/src/features/updates/catalog";

test("platform admins publish an EAT update window visible to users and can withdraw it", async ({ page, browser }) => {
  test.skip(!process.env.TEST_DATABASE_URL, "Requires an isolated local test database");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: configureTestDatabase()! }) });
  const email = `updates-${randomUUID()}@example.test`;
  const user = await db.user.create({ data: { email, fullName: "Update administrator", passwordHash: await hash("test-updates-password", 10), platformRole: "PLATFORM_ADMIN" } });
  await db.productUpdateRead.create({ data: { userId: user.id, updateId: PRODUCT_UPDATES_DISMISSED_ID } });
  const visitor = await browser.newContext();
  try {
    await page.goto("/login");
    await page.getByRole("button", { name: "Show password", exact: true }).click();
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
    await page.getByLabel("Email or username").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("test-updates-password");
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(page).toHaveURL(/\/platform$/, { timeout: 30_000 });
    const start = new Date(Date.now() + 24 * 3600000);
    const localStart = new Date(start.getTime() + 3 * 3600000).toISOString().slice(0, 16);
    await page.getByLabel("Update date and time (EAT)").fill(localStart);
    await page.getByLabel("Expected duration (minutes)").fill("45");
    await page.getByLabel("Message to users").fill("EstateDesk updates are scheduled. Please save your work before the update begins.");
    await page.getByRole("button", { name: "Notify users of scheduled update" }).click();
    await expect(page.getByText("Update notice published.", { exact: false })).toBeVisible();
    const notice = await db.platformUpdateNotice.findUniqueOrThrow({ where: { id: "global" } });
    expect(notice.startsAt.toISOString()).toBe(new Date(`${localStart}:00+03:00`).toISOString());
    expect(notice.endsAt.getTime() - notice.startsAt.getTime()).toBe(45 * 60000);
    const userPage = await visitor.newPage();
    await userPage.goto("http://127.0.0.1:" + (process.env.PLAYWRIGHT_PORT ?? "3100") + "/login");
    await expect(userPage.locator("[data-scheduled-update]")).toContainText("Scheduled EstateDesk update");
    await expect(userPage.locator("[data-scheduled-update]")).toContainText("EAT");
    const response = await userPage.request.get(new URL("/api/platform/update-notice", userPage.url()).toString());
    expect(await response.json()).not.toHaveProperty("publishedByUserId");
    await page.getByRole("button", { name: "Withdraw notice" }).click();
    await expect.poll(() => db.platformUpdateNotice.count()).toBe(0);
    await userPage.reload();
    await expect(userPage.locator("[data-scheduled-update]")).toHaveCount(0);
    expect(await db.platformUpdateNotice.count()).toBe(0);
  } finally {
    await visitor.close();
    await db.platformUpdateNotice.deleteMany({ where: { publishedByUserId: user.id } });
    await db.auditLog.deleteMany({ where: { actorUserId: user.id } });
    await db.user.delete({ where: { id: user.id } });
    await db.$disconnect();
  }
});
