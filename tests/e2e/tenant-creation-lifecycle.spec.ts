import { test, expect } from "playwright/test";
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { configureTestDatabase } from "../integration/database-safety";

test.use({ actionTimeout: 15000 });

test("tenant creation stays successful, first login works, and payments issue accessible receipts", async ({ page, browser, baseURL }) => {
 test.skip(!process.env.TENANT_START_BROWSER_FIXTURE, "Requires disposable local database fixture");
 test.setTimeout(180000);
 const databaseUrl = configureTestDatabase();
 if (!databaseUrl) throw new Error("TEST_DATABASE_URL required");
 const fixture = JSON.parse(await readFile(process.env.TENANT_START_BROWSER_FIXTURE!, "utf8"));
 const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
 const tenantContext = await browser.newContext();
 const outsider = await browser.newContext();
 const suffix = Date.now().toString();
 const fullName = `Creation regression ${suffix}`;
 const username = `creation${suffix}`;
 const password = "Temporary-pass-2026!";
 try {
  const property = await db.property.findFirstOrThrow({ where: { orgId: fixture.orgId } });
  await db.unit.create({ data: { propertyId: property.id, houseNo: `CREATE-${suffix}`, rentAmount: 15000, depositAmount: 15000, status: "VACANT" } });
  await page.context().addCookies([{ ...fixture.cookies.manager, url: baseURL! }]);
  const errors: string[] = [];
  page.on("pageerror", error => { errors.push(error.message); console.info("Browser error:", error.message); });
  page.on("console", message => { if (message.type() === "error") console.info("Browser console:", message.text().slice(0, 900)); });
  page.on("requestfailed", request => console.info("Failed request:", new URL(request.url()).pathname, request.failure()?.errorText));
  const manager = await db.membership.findFirstOrThrow({ where: { orgId: fixture.orgId, role: "MANAGER" } });
  const updatesDismissed = await db.productUpdateRead.findUnique({ where: { userId_updateId: { userId: manager.userId, updateId: "product-updates-dismissed-permanently" } } });
  await page.goto("/dashboard/org/tenants/new");
  if (!updatesDismissed) {
   await page.getByRole("button", { name: "Close what’s new", exact: true }).click();
   await expect(page.locator("dialog[data-product-updates]")).toHaveCount(0);
  }
  await expect(page.getByRole("heading", { name: "Welcome a new tenant", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /^Existing tenant/ }).click();
  await expect(page.getByRole("button", { name: /^Existing tenant/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /^New tenant/ }).click();
  await expect(page.getByRole("button", { name: /^New tenant/ })).toHaveAttribute("aria-pressed", "true");
  const next = () => page.locator('button:visible').filter({ hasText: /^Continue$/ }).click();
  await page.locator('[name="fullName"]').fill(fullName);
  await page.locator('[name="phone"]').fill(`2549${suffix.slice(-8)}`);
  await next();
  console.info("Tenant details complete");
  await page.locator('[name="nextOfKinName"]').fill("Alex Example");
  await page.locator('[name="nextOfKinRelationship"]').fill("Sibling");
  await page.locator('[name="nextOfKinPhone"]').fill("254700000001");
  await next();
  console.info("Next of kin complete");
  await page.locator('button[aria-haspopup="listbox"]').click();
  await page.getByRole("option", { name: new RegExp(`CREATE-${suffix}`) }).click();
  await page.locator('[name="monthlyRent"]').fill("12500");
  await page.locator('[name="deposit"]').fill("5000");
  await next();
  console.info("Agreed lease amounts complete");
  await page.locator('[name="username"]').fill(username);
  await page.locator('[name="password"]').fill(password);
  await page.locator('[name="confirmPassword"]').fill(password);
  await next();
  await expect(page.locator('#new-tenant-form button[type="submit"]:visible')).toBeEnabled();
  expect(await db.tenant.count({ where: { orgId: fixture.orgId, fullName } })).toBe(0);
  console.info("Submitting tenant creation");
  await page.locator('#new-tenant-form button[type="submit"]:visible').click();
  await expect(page.getByRole("heading", { name: "Account created successfully", exact: true })).toBeVisible({ timeout: 30000 });
  expect(errors).toEqual([]);
  const tenant = await db.tenant.findFirstOrThrow({ where: { orgId: fixture.orgId, fullName }, include: { leases: true } });
  expect(await db.tenant.count({ where: { orgId: fixture.orgId, fullName } })).toBe(1);
  const charges = await db.rentCharge.findMany({ where: { leaseId: tenant.leases[0].id } });
  expect(charges.find(charge => charge.chargeType === "RENT")?.amountDue.toFixed(2)).toBe("12500.00");
  expect(charges.find(charge => charge.chargeType === "DEPOSIT")?.amountDue.toFixed(2)).toBe("5000.00");
  await page.getByRole("link", { name: "Go to tenants", exact: true }).click();
  await page.getByRole("link", { name: fullName, exact: true }).first().click();
  await expect(page).toHaveURL(new RegExp(`/tenants/${tenant.slug}$`));
  await expect(page.getByRole("heading", { name: fullName, exact: true })).toBeVisible();

  const tenantPage = await tenantContext.newPage();
  await tenantPage.goto(`${baseURL}/login`);
  await tenantPage.getByRole("button", { name: "Show password", exact: true }).click();
  await tenantPage.getByLabel("Email or username").fill(username);
  await tenantPage.getByLabel("Password", { exact: true }).fill(password);
  await tenantPage.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(tenantPage).toHaveURL(/\/change-password/, { timeout: 30000 });
  await tenantPage.getByLabel("Temporary password", { exact: true }).fill(password);
  await tenantPage.getByLabel("New password", { exact: true }).fill("Updated-pass-2026!");
  await tenantPage.getByLabel("Confirm new password", { exact: true }).fill("Updated-pass-2026!");
  await tenantPage.locator('[name="acceptedTerms"]').check();
  await tenantPage.getByRole("button", { name: /save|update|continue|change password/i }).click();
  await expect(tenantPage).toHaveURL(/\/dashboard\/tenant$/, { timeout: 30000 });
  await tenantPage.goto(`${baseURL}/dashboard/tenant/payments`);
  await expect(tenantPage.getByRole("region", { name: "First rent and deposit" })).toBeVisible();

  const panel = page.getByRole("region", { name: "First rent and deposit" });
  for (const name of ["First month rent", "Security deposit"]) {
   const card = panel.getByRole("article").filter({ has: page.getByRole("heading", { name, exact: true }) });
   await card.getByRole("button", { name: "Confirm paid", exact: true }).click();
   await card.getByLabel("Payment reference / cash receipt number").fill(`${name}-${suffix}`);
   await card.getByLabel("I confirm the money").check();
   await card.getByRole("button", { name: "Confirm payment and issue receipt" }).click();
   const charge = charges.find(item => item.chargeType === (name === "First month rent" ? "RENT" : "DEPOSIT"))!;
   await expect.poll(async () => (await db.rentCharge.findUniqueOrThrow({ where: { id: charge.id } })).balance.toFixed(2), { timeout: 30000 }).toBe("0.00");
   await expect(card.getByText("Paid", { exact: true })).toBeVisible({ timeout: 30000 });
  }
  expect(await db.rentCharge.count({ where: { leaseId: tenant.leases[0].id, balance: { gt: 0 } } })).toBe(0);
  const receipts = await db.receipt.findMany({ where: { payment: { payerTenantId: tenant.id } } });
  expect(receipts).toHaveLength(2);
  for (const receipt of receipts) {
   for (const context of [page.context(), tenantContext]) {
    const response = await context.request.get(`${baseURL}/api/receipts/${receipt.id}`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/pdf");
   }
   expect((await outsider.request.get(`${baseURL}/api/receipts/${receipt.id}`)).status()).toBe(404);
  }
  await tenantPage.reload();
  await expect(tenantPage.getByRole("region", { name: "First rent and deposit" }).getByRole("button", { name: "Pay now", exact: true })).toHaveCount(0);
 } finally {
  await tenantContext.close();
  await outsider.close();
  await db.$disconnect();
 }
});
