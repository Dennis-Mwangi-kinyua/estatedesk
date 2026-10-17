import { test, expect } from "playwright/test";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { configureTestDatabase } from "../integration/database-safety";

test("gate dashboards share the workspace shell, fit both themes and retain assigned-property access", async ({ page, baseURL }) => {
  test.skip(!process.env.TEST_DATABASE_URL, "Requires an isolated local test database");
  test.setTimeout(120000);
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: configureTestDatabase()! }) });
  const org = await db.organization.create({ data: { name: "Gate operations estates", slug: `gate-browser-${randomUUID()}`, subscription: { create: { status: "ACTIVE", currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 30 * 86400000) } } } });
  const users: string[] = [];
  try {
    const first = await db.property.create({ data: { orgId: org.id, name: "Palm Court main gate" } });
    const second = await db.property.create({ data: { orgId: org.id, name: "Riverside gate" } });
    const tenantUser = await db.user.create({ data: { fullName: "Inviting tenant", passwordHash: "test-only" } }); users.push(tenantUser.id);
    const tenant = await db.tenant.create({ data: { orgId: org.id, userId: tenantUser.id, fullName: "Inviting tenant", phone: "0700000000" } });
    const unit = await db.unit.create({ data: { propertyId: first.id, houseNo: "A1", rentAmount: 10000, status: "OCCUPIED" } });
    const lease = await db.lease.create({ data: { orgId: org.id, unitId: unit.id, tenantId: tenant.id, startDate: new Date(Date.now() - 86400000), monthlyRent: 10000, status: "ACTIVE" } });
    const code = randomBytes(32).toString("base64url");
    await db.visitorPass.create({ data: { orgId: org.id, tenantUserId: tenantUser.id, leaseId: lease.id, propertyId: first.id, visitorName: "Expected gate visitor", tokenHash: createHash("sha256").update(code).digest("hex"), validFrom: new Date(Date.now() - 60000), validUntil: new Date(Date.now() + 3600000) } });
    for (const role of ["ADMIN", "CARETAKER", "OFFICE"] as const) {
      const user = await db.user.create({ data: { fullName: `${role} gate operator`, passwordHash: "test-only", termsAcceptedAt: new Date() } }); users.push(user.id);
      const membership = await db.membership.create({ data: { orgId: org.id, userId: user.id, role, scopeType: "ORG", scopeId: "ORG_SCOPE" } });
      if (role !== "ADMIN") await db.gateAssignment.create({ data: { orgId: org.id, userId: user.id, propertyId: role === "CARETAKER" ? first.id : second.id } });
      const token = randomBytes(32).toString("hex");
      await db.userSession.create({ data: { userId: user.id, activeMembershipId: membership.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 3600000) } });
      await page.context().clearCookies();
      await page.context().addCookies([{ name: "estatedesk_session", value: token, url: baseURL! }]);
      for (const theme of ["light", "dark"]) {
        await page.goto("/dashboard/gate");
        await page.evaluate(theme => localStorage.setItem("theme", theme), theme); await page.reload();
        for (const width of [320, 390, 768, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          await expect(page.getByRole("heading", { name: "Gate access", exact: true })).toBeVisible();
          await expect(page.locator("header").first()).toBeVisible();
          expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
          await expect(page.getByRole("heading", { name: "Verify visitor pass" })).toBeVisible();
          if (width === 1440) await expect(page.locator('aside a[href="/dashboard/gate"][aria-current="page"]').first()).toBeVisible();
          else {
            const menu = page.getByRole("button", { name: role === "CARETAKER" ? "Open navigation menu" : "Open navigation", exact: true });
            await expect(menu).toBeVisible();
          }
        }
      }
      if (role === "ADMIN") await expect(page.getByRole("heading", { name: "Assign gate staff" })).toBeVisible();
      else {
        await expect(page.getByRole("heading", { name: "Assign gate staff" })).toHaveCount(0);
        const gates = page.locator("section").filter({ has: page.getByRole("heading", { name: "Your assigned gates" }) });
        await expect(gates).toContainText(role === "CARETAKER" ? first.name : second.name);
        await expect(gates).not.toContainText(role === "CARETAKER" ? second.name : first.name);
      }
      await page.getByLabel("Pass code", { exact: true }).fill(code);
      await page.getByRole("button", { name: "Verify details" }).click();
      if (role === "OFFICE") await expect(page.getByRole("alert").filter({ hasText: "assigned" })).toContainText("assigned");
      else await expect(page.getByText("Expected gate visitor", { exact: true })).toBeVisible();
    }
  } finally {
    await db.organization.delete({ where: { id: org.id } });
    await db.auditLog.deleteMany({ where: { actorUserId: { in: users } } });
    await db.user.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  }
});
