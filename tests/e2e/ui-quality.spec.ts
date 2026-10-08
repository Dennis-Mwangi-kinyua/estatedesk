import { expect, test } from "playwright/test";
import { expectReadableWords } from "./assert-readable-words";

// Navigation styling checks run independently of service-worker activation reloads.
test.use({ serviceWorkers: "block" });

for (const theme of ["light", "dark"] as const) {
  test(`public pages have usable ${theme} layouts and labeled form controls`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
    for (const route of ["/", "/login", "/register", "/pricing", "/privacy", "/vacancies"]) {
      const response = await page.goto(route);
      await page.waitForLoadState("networkidle");
      expect(response?.status(), route).toBe(200);
      await expect(page.locator("html")).toHaveClass(new RegExp(theme));
      await expect(page.locator("h1").first()).toBeAttached();
      const issues = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        unlabeled: Array.from(document.querySelectorAll<HTMLInputElement>("input:not([type=hidden]),select,textarea")).filter((element) => !element.labels?.length && !element.getAttribute("aria-label") && !element.getAttribute("aria-labelledby")).map((element) => element.name),
      }));
      expect(issues.overflow, route).toBe(false);
      expect(issues.unlabeled, route).toEqual([]);
    }
  });
}

test("mobile public menu contains focus, closes with Escape, and returns focus", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile navigation appears below the desktop breakpoint.");
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Open menu", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Site navigation" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("small-screen login remains usable when the keyboard reduces viewport height", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto("/login");
  const password = page.getByLabel("Password", { exact: true });
  await password.scrollIntoViewIfNeeded();
  await password.fill("ui-review-only");
  await expect(password).toBeFocused();
  await expect(page.getByRole("button", { name: "Log in", exact: true })).toBeVisible();
});

test("login showcase keeps whole words and separates cards on laptop screens", async ({ page }) => {
  for (const width of [1024, 1280, 1920]) {
    await page.setViewportSize({ width, height: 600 });
    await page.goto("/login");
    await expect(page.getByLabel("Email or username")).toBeVisible();
    await expectReadableWords(page, "aside");
    const collisions = await page.locator("aside h3").evaluateAll(headings => headings.filter(heading => {
      const description = heading.nextElementSibling;
      return description && heading.getBoundingClientRect().bottom > description.getBoundingClientRect().top + 1;
    }).map(heading => heading.textContent));
    expect(collisions).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});
