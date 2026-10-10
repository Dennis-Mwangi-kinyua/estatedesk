import { test, expect } from "playwright/test";
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { validateImageBytes } from "../../apps/web/src/lib/uploads/secure-image";
import { configureTestDatabase } from "../integration/database-safety";

// Authenticated routes compile on first use in the development browser server.
test.setTimeout(120_000);
test.use({ actionTimeout: 30_000 });


test("tenant cancels a notice and scheduled inspection without losing their session", async ({ page, baseURL }) => {
  test.skip(!process.env.MOVEOUT_BROWSER_FIXTURE, "Requires an explicitly seeded isolated local database");
  const databaseUrl = configureTestDatabase();
  if (!databaseUrl) throw new Error("TEST_DATABASE_URL required");
  const fixture = JSON.parse(await readFile(process.env.MOVEOUT_BROWSER_FIXTURE!, "utf8"));
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  const cookieUrl = fixture.cookies.tenant.secure ? baseURL!.replace("http:", "https:") : baseURL!;
  const originalNotice = await db.moveOutNotice.findUniqueOrThrow({ where: { id: fixture.noticeId }, include: { inspection: true } });
  await page.context().addCookies([{ ...fixture.cookies.tenant, url: cookieUrl }]);
  try {
    const tenant = await db.tenant.findUniqueOrThrow({ where: { id: fixture.tenantId } });
    const sessionsBefore = await db.userSession.findMany({ where: { userId: tenant.userId! }, select: { id: true, tokenHash: true } });
    for (const scheduled of [true, false]) {
      await db.moveOutNotice.update({ where: { id: fixture.noticeId }, data: { status: scheduled ? "INSPECTION_SCHEDULED" : "SUBMITTED" } });
      await db.inspection.updateMany({ where: { noticeId: fixture.noticeId }, data: { status: scheduled ? "SCHEDULED" : "CANCELLED", completedAt: null } });
      await page.goto("/dashboard/tenant/notices");
      await page.getByRole("button", { name: "Cancel move-out notice", exact: true }).click();
      await expect(page.getByText("Your lease will stay active.", { exact: false })).toBeVisible();
      if (scheduled) await expect(page.getByText("Your scheduled move-out inspection will also be cancelled.", { exact: false })).toBeVisible();
      await page.getByRole("button", { name: "Keep notice", exact: true }).click();
      expect((await db.moveOutNotice.findUniqueOrThrow({ where: { id: fixture.noticeId } })).status).toBe(scheduled ? "INSPECTION_SCHEDULED" : "SUBMITTED");
      await page.getByRole("button", { name: "Cancel move-out notice", exact: true }).click();
      await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.getByRole("button", { name: "Yes, cancel notice", exact: true }).click()]);
      await expect(page).toHaveURL(/\/dashboard\/tenant\/move-out(?:\?success=notice_withdrawn)?$/);
      await expect(page.getByText("Notice withdrawn. The lease continues.", { exact: true })).toBeVisible();
      const notice = await db.moveOutNotice.findUniqueOrThrow({ where: { id: fixture.noticeId }, include: { inspection: true, lease: true } });
      expect(notice.status).toBe("CANCELLED");
      expect(notice.inspection?.status).toBe("CANCELLED");
      expect(notice.lease.status).toBe("ACTIVE");
      await expect(page.getByRole("button", { name: "Cancel move-out notice", exact: true })).toHaveCount(0);
    }
    expect(await db.userSession.findMany({ where: { userId: tenant.userId! }, select: { id: true, tokenHash: true } })).toEqual(sessionsBefore);
    expect((await db.tenant.findUniqueOrThrow({ where: { id: tenant.id } })).status).toBe("ACTIVE");
    await page.goto("/dashboard/tenant/lease");
    await expect(page).toHaveURL(/\/dashboard\/tenant\/lease/);
  } finally {
    await db.moveOutNotice.update({ where: { id: fixture.noticeId }, data: { status: originalNotice.status } });
    if (originalNotice.inspection) await db.inspection.update({ where: { id: originalNotice.inspection.id }, data: { status: originalNotice.inspection.status, completedAt: originalNotice.inspection.completedAt } });
    await db.$disconnect();
  }
});

test("move-out handover, private refund proof, report permissions and retained receipts", async ({ page, browser, baseURL }) => {
  test.skip(!process.env.MOVEOUT_BROWSER_FIXTURE, "Requires an explicitly seeded isolated local database");
  const databaseUrl = configureTestDatabase();
  if (!databaseUrl) throw new Error("TEST_DATABASE_URL required");
  const fixture = JSON.parse(await readFile(process.env.MOVEOUT_BROWSER_FIXTURE!, "utf8"));
  const cookieUrl = fixture.cookies.manager.secure ? baseURL!.replace("http:", "https:") : baseURL!;
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  await page.context().addCookies([{ ...fixture.cookies.manager, url: cookieUrl }]);
  try {
    console.log("Opening move-out workspace");
    await page.goto("/dashboard/org/move-outs");
    const form = page.getByRole("heading", { name: "Confirm handover and settlement" }).locator("..");
    await expect(form.getByLabel("Deposit actually held")).toHaveValue("12000.00", { timeout: 30_000 });
    console.log("Filling handover form");
    await form.getByLabel("Actual handover date").fill(fixture.day);
    await form.getByRole("button", { name: "Add cost", exact: true }).click();
    await form.getByLabel("Cost description").fill("Door repair");
    await form.getByLabel("Amount", { exact: true }).fill("500");
    await form.getByLabel("Final balance and handover notes").fill("Final bills reviewed, door repair agreed and keys returned.");
    await form.getByLabel("Keys have been returned", { exact: false }).check();
    await form.getByLabel("Final rent, water", { exact: false }).check();
    await form.getByLabel("Final meter readings", { exact: false }).check();
    console.log("Generating report");
    const downloadEvent = page.waitForEvent("download");
    await form.getByRole("link", { name: "Open move-out report with these costs (new tab)" }).click();
    const report = await downloadEvent;
    const bytes = await readFile((await report.path())!);
    expect(bytes.subarray(0, 4).toString()).toBe("%PDF");
    await form.getByLabel("I generated and reviewed", { exact: false }).check();
    console.log("Closing handover");
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), form.getByRole("button", { name: "Confirm handover and close", exact: true }).click()]);
    await expect(page.getByText(/^REFUND PENDING · Current amount owed/)).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect((await db.unit.findUniqueOrThrow({ where: { id: fixture.unitId } })).status).toBe("UNDER_MAINTENANCE");
    const notice = await db.moveOutNotice.findUniqueOrThrow({ where: { id: fixture.noticeId } });
    const closeout = notice.closeout as Record<string, unknown>;
    const receipt = await db.receipt.findUniqueOrThrow({ where: { paymentId: String(closeout.depositPaymentId) } });
    const image = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAHUlEQVR4nGP4TyJgGNVABGAgRhEyGNVADKB9KAEAr639HzhpQWIAAAAASUVORK5CYII=", "base64");
    console.log("Recording refund");
    await page.getByLabel("Paid refund reference").fill(`BROWSER-${fixture.noticeId}`);
    await page.getByLabel("Refund payment proof").setInputFiles({ name: "proof.png", mimeType: "image/png", buffer: image });
    await page.getByLabel("I confirm this refund has already been paid.").check();
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.getByRole("button", { name: "Record paid refund", exact: true }).click()]);
    await expect(page.getByText(/^SETTLED · Current amount owed/)).toBeVisible();
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Repairs and cleaning completed", { exact: false }).check();
    await page.getByRole("button", { name: "Mark unit vacant and ready" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Unit is vacant and ready to let." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Mark unit vacant and ready" })).toHaveCount(0);
    expect((await db.unit.findUniqueOrThrow({ where: { id: fixture.unitId } })).status).toBe("VACANT");
    const tenantContext = await browser.newContext({ ignoreHTTPSErrors: new URL(baseURL!).hostname === "127.0.0.1", extraHTTPHeaders: { Cookie: `${fixture.cookies.tenant.name}=${fixture.cookies.tenant.value}` } });
    await tenantContext.addCookies([{ ...fixture.cookies.tenant, url: cookieUrl }]);
    const tenantReport = await tenantContext.request.get(`${baseURL}/api/move-outs/${fixture.noticeId}/report`);
    expect(tenantReport.status()).toBe(200); expect(tenantReport.headers()["content-type"]).toContain("application/pdf");
    const tenantProof = await tenantContext.request.get(`${baseURL}/api/move-outs/${fixture.noticeId}/refund-proof`);
    expect(tenantProof.status()).toBe(200); const downloadedProof = validateImageBytes(await tenantProof.body()); expect(tenantProof.headers()["content-type"]).toContain(downloadedProof.mimeType);
    const tenantReceipt = await tenantContext.request.get(`${baseURL}/dashboard/tenant/receipts/${receipt.id}`);
    expect(tenantReceipt.status()).toBe(200); expect(tenantReceipt.headers()["content-type"]).toContain("application/pdf");
    await tenantContext.close();
    const otherContext = await browser.newContext({ ignoreHTTPSErrors: new URL(baseURL!).hostname === "127.0.0.1", extraHTTPHeaders: { Cookie: `${fixture.cookies.outsider.name}=${fixture.cookies.outsider.value}` } });
    await otherContext.addCookies([{ ...fixture.cookies.outsider, url: cookieUrl }]);
    for (const suffix of ["report", "refund-proof"]) {
      const response = await otherContext.request.get(`${baseURL}/api/move-outs/${fixture.noticeId}/${suffix}`, { maxRedirects: 0 });
      expect([303, 307, 401, 403, 404]).toContain(response.status());
    }
    const otherReceipt = await otherContext.request.get(`${baseURL}/dashboard/tenant/receipts/${receipt.id}`, { maxRedirects: 0 });
    expect([303, 307, 401, 403, 404]).toContain(otherReceipt.status());
    await otherContext.close();
  } finally { await db.$disconnect(); }
});
