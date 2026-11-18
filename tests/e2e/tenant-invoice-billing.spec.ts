import { readFile } from "node:fs/promises";
import { test, expect } from "playwright/test";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PRODUCT_UPDATES_DISMISSED_ID } from "../../apps/web/src/features/updates/catalog";
import { configureTestDatabase } from "../integration/database-safety";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  if (process.env.BILLING_THROTTLED !== "1") return;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: 1_600_000 / 8,
    uploadThroughput: 750_000 / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
});


test("tenant filters invoices and sees the exact checkout amount on a 320px screen", async ({ page, baseURL, isMobile }) => {
  test.skip(isMobile, "Exercises the 320px layout in one browser project");
  test.skip(!process.env.BILLING_BROWSER_FIXTURE || !process.env.TEST_DATABASE_URL, "Requires an isolated billing fixture");
  test.setTimeout(120_000);
  const databaseUrl = configureTestDatabase()!;
  const fixture = JSON.parse(await readFile(process.env.BILLING_BROWSER_FIXTURE!, "utf8"));
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  const period = fixture.day.slice(0, 7);
  try {
    const tenant = await db.tenant.findUniqueOrThrow({ where: { id: fixture.tenantId } });
    await db.productUpdateRead.createMany({
      data: [{ userId: tenant.userId!, updateId: PRODUCT_UPDATES_DISMISSED_ID }],
      skipDuplicates: true,
    });
    const rent = await db.rentCharge.findFirstOrThrow({
      where: { orgId: fixture.orgId, period, chargeType: "RENT" },
    });
    await db.rentCharge.update({
      where: { id: rent.id },
      data: { amountDue: 10000.25, balance: 10000.25 },
    });
    try {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.context().addCookies([{ ...fixture.cookies.tenant, url: fixture.cookies.tenant.secure ? baseURL!.replace("http:", "https:") : baseURL! }]);
      await page.goto("/dashboard/tenant/invoice?status=paid");
      const filters = page.getByRole("navigation", { name: "Invoice status" });
      await expect(filters.getByRole("link", { name: "Paid", exact: true })).toHaveAttribute("aria-current", "page");
      await expect(page.getByText("No bills match this status.")).toBeVisible();
      await filters.getByRole("link", { name: "Unpaid", exact: true }).click();
      await expect(page).toHaveURL(/status=unpaid$/, { timeout: 30_000 });
      const bill = page.locator("article").filter({ hasText: period }).first();
      await expect(bill.getByRole("link", { name: "Download Invoice" })).toBeVisible();
      await expect(bill.getByText(/11,000\.25/).first()).toBeVisible();
      expect(await bill.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

      await page.goto(`/dashboard/tenant/payments/checkout?source=period_bill&id=${period}&method=manual-bank`);
      await expect(page.getByLabel("Amount to pay")).toHaveValue("11000.25");
      await expect(page.getByLabel("Amount to pay")).toHaveAttribute("inputmode", "decimal");
    } finally {
      await db.rentCharge.update({
        where: { id: rent.id },
        data: { amountDue: rent.amountDue, balance: rent.balance },
      });
    }
  } finally {
    await db.$disconnect();
  }
});

test("tenants can review archived bills, final statements and interrupted STK attempts", async ({ browser, page, baseURL, isMobile }) => {
  test.skip(isMobile, "Exercises the 320px layout in one browser project");
  test.skip(!process.env.BILLING_BROWSER_FIXTURE || !process.env.TEST_DATABASE_URL, "Requires an isolated billing fixture");
  test.setTimeout(120_000);
  const databaseUrl = configureTestDatabase()!;
  const fixture = JSON.parse(await readFile(process.env.BILLING_BROWSER_FIXTURE!, "utf8"));
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  const handover = new Date(`${fixture.day}T00:00:00+03:00`);
  const period = fixture.day.slice(0, 7);
  const notice = await db.moveOutNotice.findUniqueOrThrow({ where: { id: fixture.noticeId }, include: { lease: true } });
  const tenant = await db.tenant.findUniqueOrThrow({ where: { id: fixture.tenantId } });
  const outsider = await db.user.findUniqueOrThrow({ where: { email: `other-${notice.id}@example.test` } });
  const otherTenant = await db.tenant.create({
    data: { orgId: fixture.orgId, userId: outsider.id, fullName: "Other tenant", phone: "254700000099", status: "INACTIVE" },
  });
  const payment = await db.payment.create({
    data: { orgId: fixture.orgId, payerTenantId: fixture.tenantId, amount: 100, method: "MPESA_STK", targetType: "COMBINED" },
  });
  try {
    await db.productUpdateRead.createMany({
      data: [{ userId: tenant.userId!, updateId: PRODUCT_UPDATES_DISMISSED_ID }],
      skipDuplicates: true,
    });
    await db.$transaction([
      db.tenant.update({ where: { id: tenant.id }, data: { status: "INACTIVE" } }),
      db.lease.update({ where: { id: notice.leaseId }, data: { status: "TERMINATED", endDate: handover } }),
      db.moveOutNotice.update({
        where: { id: notice.id },
        data: {
          status: "CLOSED", actualMoveOutDate: handover, closedAt: handover,
          closeout: { depositHeld: 12000, deductions: 11000, outstandingBills: 11000, totalCosts: 11000, amountOwed: 0, refundDue: 1000, refundStatus: "PENDING" },
        },
      }),
    ]);
    await page.setViewportSize({ width: 320, height: 640 });
    await page.context().addCookies([{ ...fixture.cookies.tenant, url: fixture.cookies.tenant.secure ? baseURL!.replace("http:", "https:") : baseURL! }]);
    await page.goto("/dashboard/tenant/history");
    await page.getByRole("link", { name: "Browse invoice archive" }).click();
    await expect(page.getByRole("heading", { name: "Invoice archive" })).toBeVisible({ timeout: 30_000 });
    const invoice = page.getByRole("link", { name: `Download invoice for ${period}` });
    const invoicePath = (await invoice.getAttribute("href"))!;
    const [download] = await Promise.all([page.waitForEvent("download"), invoice.click()]);
    expect((await readFile((await download.path())!)).subarray(0, 4).toString()).toBe("%PDF");

    await page.goto("/dashboard/tenant/history#move-outs");
    const statement = page.getByRole("link", { name: "View final statement" });
    const statementPath = (await statement.getAttribute("href"))!;
    await statement.click();
    await expect(page.getByRole("heading", { name: "Final move-out statement" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Refund pending", { exact: false })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Current unpaid balance" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

    const statusPath = `/dashboard/tenant/payments/status?payment=${payment.id}`;
    await page.goto(statusPath);
    await expect(page.getByRole("heading", { name: "Confirmation unavailable" })).toBeVisible();
    await expect(page.getByText(/contact your property manager before trying again/)).toBeVisible();

    const other = await browser.newContext({ baseURL });
    try {
      await other.addCookies([{ ...fixture.cookies.outsider, url: fixture.cookies.outsider.secure ? baseURL!.replace("http:", "https:") : baseURL! }]);
      const privateInvoice = await other.request.get(invoicePath, {
        maxRedirects: 0,
        headers: { Cookie: `${fixture.cookies.outsider.name}=${fixture.cookies.outsider.value}` },
      });
      expect(privateInvoice.status()).toBe(404);
      const otherPage = await other.newPage();
      for (const path of [statementPath, statusPath]) {
        await otherPage.goto(path);
        await expect(otherPage.getByText("This page could not be found.", { exact: true })).toBeVisible();
      }
    } finally {
      await other.close();
    }
  } finally {
    await db.$transaction([
      db.tenant.delete({ where: { id: otherTenant.id } }),
      db.tenant.update({ where: { id: tenant.id }, data: { status: tenant.status } }),
      db.payment.delete({ where: { id: payment.id } }),
      db.lease.update({ where: { id: notice.leaseId }, data: { status: notice.lease.status, endDate: notice.lease.endDate } }),
      db.moveOutNotice.update({ where: { id: notice.id }, data: { status: notice.status, actualMoveOutDate: notice.actualMoveOutDate, closedAt: notice.closedAt, closeout: notice.closeout ?? Prisma.DbNull } }),
    ]);
    await db.$disconnect();
  }
});
