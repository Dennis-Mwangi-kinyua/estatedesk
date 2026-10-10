import { test, expect } from "playwright/test";
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { configureTestDatabase } from "../integration/database-safety";

test.use({ screenshot: "only-on-failure" });

const money = (amount: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amount);

test("first rent and deposit appear in both portals; confirmation issues shared private receipts", async ({ page, browser, baseURL }) => {
  test.skip(!process.env.TENANT_START_BROWSER_FIXTURE, "Requires a seeded disposable local database");
  test.setTimeout(120000);
  const databaseUrl = configureTestDatabase();
  if (!databaseUrl) throw new Error("TEST_DATABASE_URL required");
  const fixture = JSON.parse(await readFile(process.env.TENANT_START_BROWSER_FIXTURE!, "utf8"));
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  const tenant = await browser.newContext({ viewport: page.viewportSize() });
  const outsider = await browser.newContext();
  await page.context().addCookies([{ ...fixture.cookies.manager, url: baseURL! }]);
  await tenant.addCookies([{ ...fixture.cookies.tenant, url: baseURL! }]);
  await outsider.addCookies([{ ...fixture.cookies.outsider, url: baseURL! }]);
  try {
    await page.goto(`/dashboard/org/tenants/${fixture.tenantSlug}`, { waitUntil: "domcontentloaded" });
    const panel = page.getByRole("region", { name: "First rent and deposit" });
    await expect(panel).toBeVisible();
    await expect(panel.getByText("Tenancy started 2025-01-01", { exact: true })).toBeVisible();
    await expect(panel.getByText("Waived", { exact: true })).toBeVisible();
    await expect(panel.getByText(`Total remaining: ${money(30000)}`, { exact: true })).toBeVisible();
    const tenantPage = await tenant.newPage();
    await tenantPage.goto("/dashboard/tenant", { waitUntil: "domcontentloaded" });
    await expect(tenantPage.getByRole("region", { name: "First rent and deposit" })).toBeVisible();
    const startingCharges = tenantPage.getByRole("region", { name: "First rent and deposit" });
    await expect(startingCharges.getByRole("link", { name: "Pay now", exact: true })).toHaveCount(2);
    for (const type of ["RENT", "DEPOSIT"] as const) {
      const charge = await db.rentCharge.findFirstOrThrow({ where: { leaseId: fixture.leaseId, chargeType: type } });
      const card = startingCharges.getByRole("article").filter({ has: tenantPage.getByRole("heading", { name: type === "RENT" ? "First month rent" : "Security deposit", exact: true }) }).filter({ hasNot: tenantPage.getByText("Waived", { exact: true }) });
      const href = await card.getByRole("link", { name: "Pay now", exact: true }).getAttribute("href");
      const url = new URL(href!, baseURL);
      expect(url.searchParams.get("source")).toBe("rent_charge");
      expect(url.searchParams.get("id")).toBe(charge.id);
      expect(url.searchParams.get("amount")).toBe("15000.00");
    }
    const deposit = await db.rentCharge.findFirstOrThrow({ where: { leaseId: fixture.leaseId, chargeType: "DEPOSIT" } });
    const pending = await db.payment.create({ data: { orgId: fixture.orgId, payerTenantId: fixture.tenantId, rentChargeId: deposit.id, targetType: "DEPOSIT", method: "CASH", amount: 15000, gatewayStatus: "PENDING", verificationStatus: "PENDING" } });
    const reviewPage = await page.context().newPage();
    await reviewPage.goto("/dashboard/org/payments", { waitUntil: "domcontentloaded" });
    const review = reviewPage.getByRole("article", { name: "Review payment from New tenancy browser tenant" });
    await expect(review).toBeVisible();
    await expect(review.getByLabel("2. Record how you confirmed payment")).toBeVisible();
    await expect(review.getByRole("button", { name: "Verify payment & issue receipt" })).toBeVisible();
    await review.getByText("Payment cannot be confirmed?", { exact: true }).click();
    await expect(review.getByLabel("Rejection reason")).toBeVisible();
    expect(await reviewPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await reviewPage.close();
    const depositCard = panel.getByRole("article").filter({ has: page.getByRole("heading", { name: "Security deposit", exact: true }) });
    await depositCard.getByRole("button", { name: "Confirm paid", exact: true }).click();
    await depositCard.getByLabel("Payment reference / cash receipt number").fill(`DEPOSIT-${fixture.leaseId}`);
    await depositCard.getByLabel("I confirm the money").check();
    await depositCard.getByRole("button", { name: "Confirm payment and issue receipt" }).click();
    await expect(depositCard.getByRole("alert")).toContainText("awaiting review", { timeout: 15000 });
    await db.payment.update({ where: { id: pending.id }, data: { gatewayStatus: "SUCCESS" } });
    await depositCard.getByRole("button", { name: "Confirm payment and issue receipt" }).click();
    await expect(depositCard.getByRole("alert")).toContainText("awaiting review", { timeout: 15000 });
    await db.payment.delete({ where: { id: pending.id } });
    await depositCard.getByLabel("Amount received").fill("5000");
    await depositCard.getByRole("button", { name: "Confirm payment and issue receipt" }).click();
    await expect(depositCard.getByText("Partially paid", { exact: true })).toBeVisible({ timeout: 30000 });
    await depositCard.getByRole("button", { name: "Confirm paid", exact: true }).click();
    await depositCard.getByLabel("Payment reference / cash receipt number").fill(`DEPOSIT-REST-${fixture.leaseId}`);
    await depositCard.getByLabel("I confirm the money").check();
    await depositCard.getByRole("button", { name: "Confirm payment and issue receipt" }).click();
    await expect(depositCard.getByText("Paid", { exact: true })).toBeVisible({ timeout: 30000 });
    const rentCard = panel.getByRole("article").filter({ has: page.getByRole("heading", { name: "First month rent", exact: true }) }).filter({ hasNot: page.getByText("Waived", { exact: true }) });
    await rentCard.getByRole("button", { name: "Confirm paid", exact: true }).click();
    await rentCard.getByLabel("Payment reference / cash receipt number").fill(`DEPOSIT-${fixture.leaseId}`);
    await rentCard.getByLabel("I confirm the money").check();
    await rentCard.getByRole("button", { name: "Confirm payment and issue receipt" }).click();
    await expect(rentCard.getByRole("alert")).toContainText("already been recorded");
    await rentCard.getByLabel("Payment reference / cash receipt number").fill(`RENT-${fixture.leaseId}`);
    await rentCard.getByRole("button", { name: "Confirm payment and issue receipt" }).click();
    await expect(panel.getByText(`Total remaining: ${money(0)}`, { exact: true })).toBeVisible({ timeout: 30000 });
    await expect(panel.getByRole("button", { name: "Confirm paid", exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const receipts = await db.receipt.findMany({ where: { payment: { payerTenantId: fixture.tenantId } } });
    expect(receipts).toHaveLength(3);
    for (const receipt of receipts) {
      for (const context of [page.context(), tenant]) {
        const response = await context.request.get(`/api/receipts/${receipt.id}`.replace(/^\//, `${baseURL}/`));
        expect(response.status()).toBe(200);
        expect(response.headers()["content-type"]).toContain("application/pdf");
      }
      const response = await outsider.request.get(`${baseURL}/api/receipts/${receipt.id}`);
      expect(response.status()).toBe(404);
    }
    await tenantPage.goto("/dashboard/tenant/payments", { waitUntil: "domcontentloaded" });
    const tenantPanel = tenantPage.getByRole("region", { name: "First rent and deposit" });
    await expect(tenantPanel.getByText("Tenancy started 2025-01-01", { exact: true })).toBeVisible();
    await expect(tenantPanel.getByText("Waived", { exact: true })).toBeVisible();
    await expect(tenantPanel.getByRole("link", { name: /Receipt / })).toHaveCount(3);
    await expect(tenantPanel.getByRole("link", { name: "Pay now", exact: true })).toHaveCount(0);
    const [download] = await Promise.all([
      tenantPage.waitForEvent("download"),
      tenantPanel.getByRole("link", { name: /Receipt / }).first().click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    expect(await download.failure()).toBeNull();
    expect(tenantPage.url()).toContain("/dashboard/tenant/payments");
    const dashboard = await tenantPage.goto("/dashboard/tenant");
    expect(dashboard?.status()).toBe(200);
    expect(tenantPage.url()).toContain("/dashboard/tenant");
    expect(tenantPage.url()).not.toMatch(/login|are-you-lost/);
    expect(await tenantPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const payments = await db.payment.findMany({ where: { payerTenantId: fixture.tenantId }, include: { allocations: true } });
    expect(payments).toHaveLength(3);
    expect(payments.every(payment => payment.verificationStatus === "VERIFIED" && payment.allocations.length === 1)).toBe(true);
  } finally { await tenant.close(); await outsider.close(); await db.$disconnect(); }
});
