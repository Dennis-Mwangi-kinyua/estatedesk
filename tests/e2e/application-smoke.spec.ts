import { expect, test } from "playwright/test";

test("public trust and login surfaces are available", async ({ page }) => {
  await page.goto("/login");

  await expect(page).toHaveTitle(/Sign in to EstateDesk/);
  await expect(page.getByLabel("Email or username")).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Show password" })).toBeVisible();

  await page.goto("/privacy");
  await expect(
    page.getByRole("heading", { level: 1, name: /privacy/i }),
  ).toBeVisible();
});

test("private dashboards require authentication", async ({ page }) => {
  await page.goto("/dashboard/tenant");

  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect(page.getByLabel("Email or username")).toBeVisible();
});

test("liveness endpoint returns a bounded health response", async ({ request }) => {
  const response = await request.get("/api/health");

  expect([200, 503]).toContain(response.status());
  const body = await response.json();
  expect(body.service).toBe("estatedesk");
  expect(["ok", "degraded"]).toContain(body.status);
  expect(Number.isNaN(Date.parse(body.checkedAt))).toBe(false);
  expect(body).not.toHaveProperty("database");
  expect(body).not.toHaveProperty("ops");
  expect(body).not.toHaveProperty("environment");
  expect(body).not.toHaveProperty("uptimeSeconds");
});
