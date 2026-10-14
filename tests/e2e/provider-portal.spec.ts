import { test, expect } from "playwright/test";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { configureTestDatabase } from "../integration/database-safety";
test.setTimeout(120_000);
test("provider registers, edits portfolio, sees relevant updates and remains responsive", async ({ page }) => {
  test.skip(!process.env.TEST_DATABASE_URL, "Requires an isolated local test database");
  const url = configureTestDatabase()!;
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  const suffix = randomUUID();
  const email = `provider-${suffix}@example.test`;
  const name = `Provider ${suffix.slice(0, 6)}`;
  try {
    await page.goto("/service-providers/register");
    await page.getByLabel("Full name", { exact: true }).fill("Test service professional");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password (at least 12 characters)").fill("test-provider-password");
    await page.getByLabel("National ID number (private, unique across accounts)").fill(suffix.replaceAll("-", "").slice(0, 20));
    await page.getByLabel("Business or trading name").fill(name);
    await page.getByLabel("Service category").selectOption("Plumbing");
    await page.getByLabel("Location / area served").fill("Nairobi, Westlands");
    await page.getByLabel("About your services and experience").fill("Plumbing repairs and installations for apartments and offices.");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page).toHaveURL(/\/provider$/);
    await expect(page.getByText("New updates for your role", { exact: false })).toBeVisible();
    await expect(page.locator("[data-product-updates]")).toContainText("Service provider marketplace");
    await expect(page.locator("[data-product-updates]")).not.toContainText("Provider oversight and reports");
    await page.getByRole("button", { name: "Mark these updates as read" }).click();
    await expect(page.locator("[data-product-updates] summary")).toHaveText("What’s new in EstateDesk");
    await page.reload();
    await expect(page.locator("[data-product-updates] summary")).toHaveText("What’s new in EstateDesk");
    const portfolio = page.locator("section").filter({ has: page.getByRole("heading", { name: "Add a portfolio project" }) });
    await portfolio.getByLabel("Project title").fill("Kitchen tap replacement");
    await portfolio.getByLabel("Project location").fill("Westlands");
    await portfolio.getByLabel("What you delivered").fill("Replaced leaking kitchen fittings and tested the water connections.");
    await portfolio.getByRole("button", { name: "Add project", exact: true }).click();
    await expect(portfolio.getByRole("heading", { name: "Kitchen tap replacement" })).toBeVisible();
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    await db.user.update({ where: { id: user.id }, data: { profileImageUrl: "/favicon.ico" } });
    await page.reload();
    for (const theme of ["light", "dark"]) {
      await page.evaluate(theme => { document.documentElement.classList.remove("light", "dark"); document.documentElement.classList.add(theme); }, theme);
      for (const width of [320, 390, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
        const avatar = page.locator("[data-profile-avatar]");
        const shape = await avatar.evaluate(element => { const box = element.getBoundingClientRect(); const image = element.querySelector("img")!; return { width: box.width, height: box.height, radius: getComputedStyle(element).borderRadius, fit: getComputedStyle(image).objectFit }; });
        expect(Math.abs(shape.width - shape.height)).toBeLessThanOrEqual(1);
        expect(shape.radius).toBe("50%");
        expect(shape.fit).toBe("cover");
      }
    }
    await page.goto(`/service-providers/${(await db.serviceProvider.findUniqueOrThrow({ where: { userId: user.id } })).id}`);
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Kitchen tap replacement" })).toBeVisible();
    await expect(page.locator("main")).not.toContainText(email);
    await expect(page.locator("main")).not.toContainText(suffix.replaceAll("-", "").slice(0, 20).toUpperCase());
    await page.goto("/provider");
    await page.getByRole("button", { name: "Log out", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel("Email or username").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("test-provider-password");
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(page).toHaveURL(/\/provider$/);
    await expect(page.getByRole("heading", { name: "Welcome, Test service professional" })).toBeVisible();
  } finally {
    const user = await db.user.findUnique({ where: { email } });
    if (user) { await db.serviceProvider.deleteMany({ where: { userId: user.id } }); await db.user.delete({ where: { id: user.id } }); }
    await db.$disconnect();
  }
});

test("past tenants can read their own records and current occupants see only names and stay lengths", async ({ page, baseURL }) => {
  test.skip(!process.env.TEST_DATABASE_URL, "Requires an isolated local test database");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: configureTestDatabase()! }) });
  const { randomBytes, createHash } = await import("node:crypto");
  const suffix = randomUUID();
  const org = await db.organization.create({ data: { name: "Tenant history browser org", slug: `history-browser-${suffix}`, subscription: { create: { status: "ACTIVE", currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 86400000 * 30) } } } });
  const pastUser = await db.user.create({ data: { fullName: "Previous occupant", passwordHash: "test-only", termsAcceptedAt: new Date() } });
  const newUser = await db.user.create({ data: { fullName: "Current occupant", passwordHash: "test-only", termsAcceptedAt: new Date() } });
  try {
    const property = await db.property.create({ data: { orgId: org.id, name: "History apartment" } });
    const unit = await db.unit.create({ data: { propertyId: property.id, houseNo: "H1", rentAmount: 10000, status: "OCCUPIED" } });
    const past = await db.tenant.create({ data: { orgId: org.id, userId: pastUser.id, fullName: pastUser.fullName, phone: "private-past-phone", email: "private-past@example.test", status: "INACTIVE", archivedAt: new Date() } });
    const current = await db.tenant.create({ data: { orgId: org.id, userId: newUser.id, fullName: newUser.fullName, phone: "current-phone" } });
    await db.lease.create({ data: { orgId: org.id, unitId: unit.id, tenantId: past.id, monthlyRent: 10000, startDate: new Date("2025-01-01T00:00:00+03:00"), endDate: new Date("2026-01-01T00:00:00+03:00"), status: "TERMINATED" } });
    await db.lease.create({ data: { orgId: org.id, unitId: unit.id, tenantId: current.id, monthlyRent: 10000, startDate: new Date("2026-10-01T00:00:00+03:00"), status: "ACTIVE" } });
    await db.payment.create({ data: { orgId: org.id, payerTenantId: past.id, amount: 7654, method: "CASH", targetType: "RENT", reference: "PRIVATE-PAST-PAYMENT", verificationStatus: "VERIFIED", gatewayStatus: "SUCCESS" } });
    async function signInAs(userId: string) {
      const membership = await db.membership.create({ data: { orgId: org.id, userId, role: "TENANT", scopeType: "ORG", scopeId: "ORG_SCOPE" } });
      const token = randomBytes(32).toString("hex");
      await db.userSession.create({ data: { userId, activeMembershipId: membership.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 3600000) } });
      await page.context().clearCookies();
      await page.context().addCookies([{ name: "estatedesk_session", value: token, url: baseURL! }]);
    }
    await signInAs(pastUser.id);
    await page.goto("/dashboard/tenant/history");
    await expect(page.getByRole("heading", { name: "My leases, payments & records" })).toBeVisible();
    await expect(page.locator("#payments")).toContainText("PRIVATE-PAST-PAYMENT");
    await expect(page.locator("#leases")).toContainText("TERMINATED");
    await expect(page.getByText("Past tenant — account retained", { exact: true })).toBeVisible();
    await page.goto("/dashboard/tenant");
    await expect(page.getByRole("link", { name: "View all my past records" })).toBeVisible();
    await signInAs(newUser.id);
    await page.goto("/dashboard/tenant");
    const prior = page.locator("section").filter({ has: page.getByRole("heading", { name: "Previous occupants of your unit" }) });
    await expect(prior).toContainText("Previous occupant");
    await expect(prior).toContainText("365 days");
    await expect(page.locator("main").last()).not.toContainText("PRIVATE-PAST-PAYMENT");
    await expect(prior).not.toContainText("private-past-phone");
    await expect(prior).not.toContainText("private-past@example.test");
    expect(await prior.locator("a").count()).toBe(0);
  } finally {
    await db.organization.delete({ where: { id: org.id } });
    await db.user.deleteMany({ where: { id: { in: [pastUser.id, newUser.id] } } });
    await db.$disconnect();
  }
});
