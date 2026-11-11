import { PRODUCT_UPDATES_DISMISSED_ID } from "../../apps/web/src/features/updates/catalog";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { test, expect } from "playwright/test";
import { configureTestDatabase } from "../integration/database-safety";

test.use({ channel: process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === "true" ? "chrome" : undefined, actionTimeout: 15000, navigationTimeout: 60000 });

test("job advertisements and public recruitment work from posting through applicant review", async ({ page, context, baseURL }, testInfo) => {
  test.setTimeout(240000);
  const databaseUrl = configureTestDatabase(); test.skip(!databaseUrl, "Requires a disposable local test database");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl! }) });
  const tag = randomUUID();
  const staff = await db.user.create({ data: { fullName: "Recruitment browser employer", passwordHash: "test-only", termsAcceptedAt: new Date() } });
  const platform = await db.user.create({ data: { fullName: "Recruitment browser platform", passwordHash: "test-only", termsAcceptedAt: new Date(), platformRole: "PLATFORM_ADMIN" } });
  const org = await db.organization.create({ data: { name: `Browser employer ${tag}`, slug: `hiring-browser-${tag}`, subscription: { create: { plan: "FREE", status: "ACTIVE", currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 365 * 86400000) } } } });
  const member = await db.membership.create({ data: { orgId: org.id, userId: staff.id, role: "ADMIN", scopeType: "ORG", scopeId: org.id } });
  await db.productUpdateRead.createMany({ data: [staff, platform].map(user => ({ userId: user.id, updateId: PRODUCT_UPDATES_DISMISSED_ID })) });
  const login = async (userId: string, activeMembershipId?: string) => {
    const token = randomBytes(32).toString("hex");
    await db.userSession.create({ data: { userId, activeMembershipId, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 3600000) } });
    await context.clearCookies();
    await context.addCookies([{ name: process.env.TEST_SESSION_COOKIE_NAME ?? "estatedesk_session", value: token, url: baseURL!, httpOnly: true }]);
  };
  const dismissUpdates = async () => {
    const button = page.getByRole("button", { name: "Close what’s new", exact: true });
    if (await button.waitFor({ state: "visible", timeout: 2000 }).then(() => true, () => false)) await button.click();
  };
  try {
    await login(staff.id, member.id);
    for (const [path, title] of [["approvals", "Approval centre"], ["collections", "Collections today"], ["renewals", "Lease renewal centre"], ["activity", "Organization activity"], ["handovers", "Staff handover and coverage"], ["performance", "Property performance"]]) {
      await page.goto(`/dashboard/org/${path}`);
      await expect(page.getByRole("heading", { name: title, exact: true, level: 1 })).toBeVisible();
      await dismissUpdates();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.goto("/dashboard/org/recruitment");
    await expect(page.getByRole("heading", { name: "Job advertisements & hiring", exact: true })).toBeVisible();
    await page.getByLabel("Job title", { exact: true }).fill(`Browser operations manager ${tag}`);
    await page.getByLabel("Location", { exact: true }).fill("Nairobi, Kenya");
    await page.getByLabel("Responsibilities and job description").fill("Coordinate property operations, tenant support, and the management team.");
    await page.getByLabel("Requirements and qualifications").fill("Two years of experience in property management.");
    await page.getByLabel("Application closing date (Nairobi)").fill(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
    await page.getByRole("button", { name: "Create job draft", exact: true }).click();
    await expect(page.getByText("Draft created. Open it to review and publish.", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Open job draft", exact: true }).click();
    const job = await db.recruitmentJob.findFirstOrThrow({ where: { orgId: org.id } });
    expect(job.status).toBe("DRAFT");
    await page.getByLabel("Publishing status").selectOption("OPEN");
    await page.getByRole("button", { name: "Update publishing", exact: true }).click();
    await expect.poll(async () => (await db.recruitmentJob.findUniqueOrThrow({ where: { id: job.id } })).status).toBe("OPEN");
    await page.goto("/dashboard/org/recruitment?status=OPEN");
    await expect(page.getByRole("link", { name: job.title, exact: true })).toBeVisible();
    await expect(page.getByLabel("Recruitment overview")).toContainText("Live advertisements");
    await page.screenshot({ path: testInfo.outputPath("hiring-management.png"), fullPage: true, caret: "initial" });
    await page.goto("/dashboard/org/recruitment?status=DRAFT");
    await expect(page.getByRole("link", { name: job.title, exact: true })).toHaveCount(0);
    await context.clearCookies();
    await page.goto(`/careers?q=${tag}`);
    await expect(page.getByRole("heading", { name: "Find your next role in property.", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: job.title, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("public-jobs-board.png"), fullPage: true, caret: "initial" });
    if ((page.viewportSize()?.width ?? 0) < 1280) {
      const menu = page.locator(".public-mobile-navigation");
      await menu.locator("summary").click();
      await expect(menu.getByRole("link", { name: "Careers & jobs", exact: true })).toHaveAttribute("href", "/careers");
      await expect(menu.getByRole("link", { name: "Service providers", exact: true })).toHaveAttribute("href", "/service-providers");
      await menu.locator("summary").click();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/careers/${job.slug}`);
    await expect(page.getByRole("heading", { name: job.title, exact: true })).toBeVisible();
    await expect(page.getByText(`Posted by ${staff.fullName} for ${org.name}`, { exact: false })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("job-detail-phone.png"), fullPage: true, caret: "initial" });
    await page.getByLabel("Full name", { exact: true }).fill("Browser applicant");
    await page.getByLabel("Email address", { exact: true }).fill(`browser-${tag}@example.invalid`);
    await page.getByLabel("Phone number", { exact: true }).fill("0700000000");
    await page.getByLabel("Tell us about your experience and interest").fill("I have three years of experience managing properties and supporting tenants.");
    await page.getByLabel("CV (optional · PDF, up to 1MB)").setInputFiles({ name: "candidate.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nBrowser private CV\n%%EOF") });
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Submit application", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Application received", exact: true })).toBeVisible();
    const application = await db.recruitmentApplication.findFirstOrThrow({ where: { jobId: job.id } });
    expect(application.fullName).toBe("Browser applicant");
    const anonymousDownload = await context.request.get(`/api/recruitment/organization/applications/${application.id}/resume`, { maxRedirects: 0 });
    expect(anonymousDownload.headers()["content-type"] ?? "").not.toContain("application/pdf");
    await login(staff.id, member.id);
    await page.goto(`/dashboard/org/recruitment/${job.id}`);
    await expect(page.getByRole("heading", { name: "Browser applicant · Submitted", exact: true })).toBeVisible();
    await dismissUpdates();
    const download = await context.request.get(`/api/recruitment/organization/applications/${application.id}/resume`);
    expect(download.status()).toBe(200); expect(download.headers()["cache-control"]).toContain("no-store"); expect((await download.body()).toString()).toContain("Browser private CV");
    await page.getByText("Review applicant", { exact: true }).click();
    await page.getByRole("combobox", { name: "Application stage", exact: true }).selectOption("SCREENING");
    await page.getByLabel("Internal review note").fill("Relevant background; review shortlisted experience.");
    await page.getByRole("button", { name: "Save applicant review", exact: true }).click();
    await expect.poll(async () => (await db.recruitmentApplication.findUniqueOrThrow({ where: { id: application.id } })).status).toBe("SCREENING");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await login(platform.id);
    await page.goto("/platform/recruitment");
    await expect(page.getByRole("heading", { name: "Job advertisements & hiring", exact: true })).toBeVisible();
    await dismissUpdates();
    await expect(page.getByRole("link", { name: job.title, exact: true })).toHaveCount(0);
  } finally {
    await db.organization.delete({ where: { id: org.id } });
    await db.auditLog.deleteMany({ where: { actorUserId: { in: [staff.id, platform.id] } } });
    await db.user.deleteMany({ where: { id: { in: [staff.id, platform.id] } } });
    await db.$disconnect();
  }
});
