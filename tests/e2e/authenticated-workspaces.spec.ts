import { readFile, chmod } from "node:fs/promises";
import { test, expect } from "playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { configureTestDatabase } from "../integration/database-safety";

type Account = { id: string; email: string; password: string; home: string };
async function fixture() { return JSON.parse(await readFile(process.env.ROLE_WORKSPACE_FIXTURE!, "utf8")) as { orgId: string; accounts: Record<string, Account>; invitationToken: string }; }
test.beforeEach(() => { test.skip(!process.env.ROLE_WORKSPACE_FIXTURE, "Requires seeded disposable local workspaces"); });
test.describe.configure({ mode: "serial" });
test.setTimeout(120_000);
test.use({ actionTimeout: 15_000 });

for (const role of ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER", "TENANT", "LANDLORD", "SECURITY", "PLATFORM_ADMIN", "PROVIDER"]) {
  test(`${role} signs in to its work area and keeps private data uncached`, async ({ page }) => {
    configureTestDatabase();
    const { accounts } = await fixture();
    const account = accounts[role];
    await page.goto("/login");
    // Confirm hydration before filling credentials on a cold development route.
    await page.getByRole("button", { name: "Show password", exact: true }).click();
    await expect(page.locator("#password")).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Hide password", exact: true }).click();
    await page.getByLabel("Email or username").fill(account.email);
    await page.getByLabel("Password", { exact: true }).fill(account.password);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${account.home.replaceAll("/", "\\/")}(?:\\?|$)`), { timeout: 30_000 });
    const response = await page.goto(account.home, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    if (role !== "PROVIDER") expect(response?.headers()["cache-control"]).toContain("no-store");
    await expect(page.locator("main").first()).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to main content", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(() => document.activeElement?.tagName === "MAIN" || document.activeElement?.id === "main-content")).toBe(true);
    // Real signed-in state is kept only in private temporary files for local benchmarks.
    const statePath = `/tmp/estatedesk-role-state-${role}.json`;
    await page.context().storageState({ path: statePath });
    await chmod(statePath, 0o600);
    if (["TENANT", "CARETAKER", "SECURITY", "PROVIDER"].includes(role)) {
      const forbidden = await page.request.get("/dashboard/org/tenants", { maxRedirects: 0 });
      expect([302, 303, 307, 308, 401, 403, 404]).toContain(forbidden.status());
    }
  });
}

test("password change, invitation replay, expired sessions and subscriptions enforce their gates", async ({ page, browser, baseURL }) => {
  const dbUrl = configureTestDatabase()!;
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: dbUrl }) });
  const f = await fixture();
  try {
    const account = f.accounts.PASSWORD_CHANGE;
    await page.goto("/login");
    // Confirm hydration before filling credentials on a cold development route.
    await page.getByRole("button", { name: "Show password", exact: true }).click();
    await expect(page.locator("#password")).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Hide password", exact: true }).click();
    await page.getByLabel("Email or username").fill(account.email);
    await page.getByLabel("Password", { exact: true }).fill(account.password);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(page).toHaveURL(/\/change-password/, { timeout: 30_000 });
    await page.getByLabel("Temporary password", { exact: true }).fill(account.password);
    await page.getByLabel("New password", { exact: true }).fill("Updated-local-pass-2026!");
    await page.getByLabel("Confirm new password", { exact: true }).fill("Updated-local-pass-2026!");
    const terms = page.locator('input[name="acceptedTerms"]');
    if (await terms.isVisible()) await terms.check();
    await page.getByRole("button", { name: /save|update|continue|change password/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/org\/tenants/);
    const invitation = await page.request.post("/api/auth/accept-invite", { data: { token: f.invitationToken }, headers: { origin: baseURL! } });
    expect(invitation.status()).toBe(200);
    expect((await invitation.json()).redirectTo).toBe("/dashboard/org/tenants");
    expect((await page.request.post("/api/auth/accept-invite", { data: { token: f.invitationToken }, headers: { origin: baseURL! } })).ok()).toBe(false);
    const isolated = await browser.newContext();
    const expired = await isolated.newPage();
    await expired.goto(`${baseURL}/login`);
    await expired.getByLabel("Email or username").fill(f.accounts.EXPIRED_SESSION.email);
    await expired.getByLabel("Password", { exact: true }).fill(f.accounts.EXPIRED_SESSION.password);
    await expired.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(expired).toHaveURL(/\/dashboard\/org\/tenants/);
    await db.userSession.updateMany({ where: { userId: f.accounts.EXPIRED_SESSION.id }, data: { expiresAt: new Date(0) } });
    await expired.goto(`${baseURL}/dashboard/org/tenants`);
    await expect(expired).toHaveURL(/\/login/);
    await isolated.close();
    await db.subscription.update({ where: { orgId: f.orgId }, data: { status: "EXPIRED", currentPeriodEnd: new Date(0) } });
    await page.goto("/dashboard/org/tenants");
    await expect(page).toHaveURL(/\/dashboard\/billing-required/);
  } finally {
    await db.subscription.update({ where: { orgId: f.orgId }, data: { status: "ACTIVE", currentPeriodEnd: new Date(Date.now() + 30 * 86400000) } });
    await db.$disconnect();
  }
});
