import { readFile } from "node:fs/promises";
import { expect, test } from "playwright/test";

test.use({ actionTimeout: 15_000, navigationTimeout: 45_000 });

const routes = [
  ["system-health", "System health"],
  ["developer", "Build. Connect. Keep things moving."],
  ["jobs", "Cron and queue monitor"],
  ["api-explorer", "API & webhooks"],
  ["rate-limits", "Rate limits"],
  ["backups", "Backup and recovery"],
] as const;

test("engineering workspaces keep cards and long text within their boundaries", async ({ page }, testInfo) => {
  test.skip(!process.env.ROLE_WORKSPACE_FIXTURE, "Requires fictional local platform operator");
  test.skip(testInfo.project.name !== "chromium", "This test covers phone and desktop widths directly");
  test.setTimeout(240_000);
  const fixture = JSON.parse(await readFile(process.env.ROLE_WORKSPACE_FIXTURE!, "utf8"));
  const account = fixture.accounts.PLATFORM_ADMIN;
  expect(account.email).toMatch(/@example\.test$/);
  await page.goto("/login");
  await page.getByRole("button", { name: "Show password", exact: true }).click();
  await page.getByLabel("Email or username").fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/platform(?:\?|$)/, { timeout: 30_000 });

  for (const [route, heading] of routes) {
    const response = await page.goto(`/platform/${route}`, { waitUntil: "networkidle" });
    expect(response?.status(), route).toBe(200);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible({ timeout: 30_000 });
    const updates = page.getByRole("button", { name: "Close what’s new", exact: true });
    if (await updates.isVisible()) await updates.click();
    const workspace = page.locator(".engineering-workspace");
    await expect(workspace).toBeVisible();
    // Exercise real components with values longer than common database records.
    await workspace.locator(".platform-stat-card > p:first-of-type").last().evaluateAll(elements => {
      for (const element of elements) element.textContent = "INTEGRATION_CONFIGURATION_REQUIRES_OPERATOR_REVIEW";
    });
    for (const width of [360, 768, 1280, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const theme of ["light", "dark"]) {
        await page.locator("html").evaluate((element, value) => {
          element.classList.remove("light", "dark");
          element.classList.add(value);
        }, theme);
        const violations = await workspace.locator(".platform-stat-card, .workspace-panel, article, p, h1, h2, h3, code, input, select, textarea, button").evaluateAll(elements =>
          elements.filter(element => element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 2).map(element => ({ text: element.textContent?.slice(0, 100), width: element.clientWidth, scroll: element.scrollWidth })),
        );
        expect(violations, `${route}, ${width}, ${theme}: overflowing content`).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route}, ${width}: document overflow`).toBe(true);
      }
    }
    if (route === "backups") {
      await expect(page.getByLabel("Checkpoint status")).toBeVisible();
      await expect(page.getByLabel("Backup evidence", { exact: true })).toHaveAttribute("required", "");
      await expect(page.getByLabel("Restore drill evidence")).toHaveAttribute("required", "");
      await expect(page.getByRole("link", { name: "Manage data exports" })).toHaveAttribute("href", "/platform/data-management");
      // Reload the unmodified document before exercising real server-action forms.
      await page.goto("/platform/backups", { waitUntil: "networkidle" });
      expect(new URL(page.url()).hostname).toMatch(/^(127\.0\.0\.1|localhost)$/);
      const backupNote = "Synthetic UI test backup checkpoint; no actual backup was performed.";
      const restoreNote = "Synthetic UI test restore evidence; no actual restore was performed.";
      await page.getByLabel("Checkpoint status").selectOption("Review");
      await page.getByLabel("Backup evidence", { exact: true }).fill(backupNote);
      await page.getByRole("button", { name: "Record checkpoint", exact: true }).click();
      await expect(page).toHaveURL(/ok=checkpoint/, { timeout: 30_000 });
      await page.waitForLoadState("networkidle");
      await expect(page.getByText(backupNote, { exact: true })).toBeVisible();
      await page.getByLabel("Restore drill evidence").fill(restoreNote);
      await page.getByRole("button", { name: "Mark restore drill complete", exact: true }).click();
      await expect(page).toHaveURL(/ok=restore-drill/, { timeout: 30_000 });
      await page.waitForLoadState("networkidle");
      await expect(page.getByText(restoreNote, { exact: true })).toBeVisible();
      await expect(page.getByText(backupNote, { exact: true })).toBeVisible();
      const checkpoint = page.locator(".engineering-metrics article").filter({ hasText: "Operator checkpoint" });
      await expect(checkpoint).toContainText("Review");
      await page.getByLabel("Checkpoint status").evaluate((element: HTMLSelectElement) => element.add(new Option("Invalid", "Invalid", true, true)));
      await page.getByLabel("Backup evidence", { exact: true }).fill(backupNote);
      await page.getByRole("button", { name: "Record checkpoint", exact: true }).click();
      await expect(page).toHaveURL(/error=invalid-evidence/, { timeout: 30_000 });
      await expect(page.getByRole("alert").filter({ hasText: "valid checkpoint status" })).toBeVisible();
      await expect(checkpoint).toContainText("Review");
    }
  }
});
