import { expect, test } from "playwright/test";

test("demo requests are distinct from free signup and fit narrow screens", async ({ page }) => {
  await page.goto("/register?intent=demo");
  await expect(page.getByRole("heading", { name: "Book your free demo" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Request my free demo" })).toBeVisible();
  await expect(page.locator('input[name="intent"]')).toHaveValue("demo");
  await expect(page.getByRole("radio", { name: /Pro/ })).toBeChecked();
  await expect(page.locator('input[name="password"]')).toHaveCount(0);
  await expect(page.getByText(/Your trial starts only/)).toBeVisible();
  await page.getByLabel("Full name", { exact: true }).fill("Demo Visitor");
  await page.getByRole("radio", { name: /Plus/ }).check();
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue("Demo Visitor");
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 850 });
    const size = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth }));
    expect(size.content).toBeLessThanOrEqual(size.viewport);
  }
  await page.goto("/register?intent=demo&request=demo-sent");
  await expect(page.getByText("No trial has started.", { exact: false }).first()).toBeVisible();
  await page.goto("/register");
  await expect(page.getByRole("button", { name: "Create workspace and sign in" })).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
});

test("homepage highlights the guided demo", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Your portfolio. Your questions. A guided demo." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Book my free demo", exact: true })).toHaveAttribute("href", "/register?intent=demo");
});

 test("demo administration requires platform authentication", async ({ page }) => {
  await page.goto("/platform/demos");
  await expect(page).toHaveURL(/\/login/);
});
