import { createHash, randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { test, expect } from "playwright/test";
import { configureTestDatabase } from "../integration/database-safety";
import { mobileSecurityActivitySchema } from "../../packages/contracts/src/mobile";

test("personal Security Centre changes passwords securely on web and native for a non-tenant account", async ({ page, context, request, baseURL }) => {
  const databaseUrl = configureTestDatabase();
  test.skip(!databaseUrl, "Requires disposable local account records");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl! }) });
  const initial = "Initial-security-password-2026!";
  const webPassword = "New web security passphrase 2026!";
  const nativePassword = "New native security passphrase 2026!";
  const user = await db.user.create({ data: { email: `secure-${randomUUID()}@example.invalid`, fullName: "Security Centre owner", passwordHash: await bcrypt.hash(initial, 10), termsAcceptedAt: new Date() } });
  const other = await db.user.create({ data: { fullName: "Different security account", passwordHash: "fixture-only" } });
  const token = randomBytes(32).toString("hex");
  const name = process.env.TEST_SESSION_COOKIE_NAME ?? "estatedesk_session";
  const expiresAt = new Date(Date.now() + 3600000);
  const current = await db.userSession.create({ data: { userId: user.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt } });
  await db.userSession.create({ data: { userId: user.id, tokenHash: randomBytes(32).toString("hex"), expiresAt } });
  try {
    await db.passwordResetToken.create({ data: { userId: user.id, email: user.email!, token: randomBytes(32).toString("hex"), expiresAt } });
    await db.auditLog.create({ data: { actorUserId: other.id, action: "ACCOUNT_SIGNED_IN", entityType: "User", entityId: other.id, metadata: { secret: "Another account's private audit metadata" } } });
    await context.addCookies([{ name, value: token, url: baseURL!, secure: name.startsWith("__Host-"), httpOnly: true }]);
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/dashboard/security");
    await expect(page.getByRole("heading", { name: "Security Centre", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recent security activity", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByLabel("Current password", { exact: true }).fill("wrong current password");
    await page.getByLabel("New password", { exact: true }).fill(webPassword);
    await page.getByLabel("Confirm new password", { exact: true }).fill(webPassword);
    await page.getByRole("button", { name: "Update password securely", exact: true }).click();
    const passwordForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Update password securely", exact: true }) });
    await expect(passwordForm.getByRole("alert")).toContainText("Current password is incorrect");
    await expect(page.getByLabel("New password", { exact: true })).toHaveValue(webPassword);
    expect(await db.userSession.count({ where: { userId: user.id } })).toBe(2);
    await page.getByLabel("Current password", { exact: true }).fill(initial);
    await page.getByRole("button", { name: "Update password securely", exact: true }).click();
    await expect(passwordForm.getByRole("status")).toContainText("Password updated");
    expect(await db.userSession.count({ where: { userId: user.id } })).toBe(1);
    expect(await db.passwordResetToken.count({ where: { userId: user.id } })).toBe(0);
    const cookie = (await context.cookies()).find(cookie => cookie.name === name)!;
    expect(cookie.value).not.toBe(token);
    const native = { "X-EstateDesk-Client": "native", Cookie: `${name}=${cookie.value}` };
    expect((await request.get("/api/mobile/security/activity", { headers: { ...native, Cookie: `${name}=${token}` } })).status()).toBe(401);
    const activityResponse = await request.get(`/api/mobile/security/activity?userId=${other.id}`, { headers: native });
    expect(activityResponse.status()).toBe(200);
    const activity = mobileSecurityActivitySchema.parse(await activityResponse.json());
    expect(activity.events.some(event => event.label.startsWith("Password changed"))).toBe(true);
    expect(JSON.stringify(activity)).not.toContain("Another account's private audit metadata");
    const changed = await request.post("/api/mobile/security", { headers: native, data: { action: "password", currentPassword: webPassword, newPassword: nativePassword, confirmPassword: nativePassword } });
    expect(changed.status()).toBe(200);
    const result = await changed.json();
    expect(result.sessionCookie).toMatch(new RegExp(`^${name}=v1\\.`));
    expect(result.sessionCookie).not.toBe(native.Cookie);
    expect((await request.get("/api/mobile/security", { headers: native })).status()).toBe(401);
    expect((await request.get("/api/mobile/security", { headers: { ...native, Cookie: result.sessionCookie } })).status()).toBe(200);
    expect(await bcrypt.compare(nativePassword, (await db.user.findUniqueOrThrow({ where: { id: user.id } })).passwordHash)).toBe(true);
    expect((await db.userSession.findUniqueOrThrow({ where: { id: current.id } })).userId).toBe(user.id);
  } finally {
    await db.auditLog.deleteMany({ where: { actorUserId: { in: [user.id, other.id] } } });
    await db.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await db.userSession.deleteMany({ where: { userId: user.id } });
    await db.rateLimitBucket.deleteMany({ where: { key: `account-password:${user.id}` } });
    await db.user.deleteMany({ where: { id: { in: [user.id, other.id] } } });
    await db.$disconnect();
  }
});

test("public security overview stays readable with clear contact actions on phones and tablets", async ({ page }) => {
  for (const theme of ["light", "dark"]) {
    await page.addInitScript(value => localStorage.setItem("theme", value), theme);
    for (const width of [320, 768]) {
      await page.setViewportSize({ width, height: 640 });
      await page.goto("/security");
      await expect(page.getByRole("heading", { name: "Security for your property workspace", exact: true })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Protect your account", exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const contact = page.getByRole("link", { name: "Contact EstateDesk", exact: true });
      expect(await contact.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
      await contact.scrollIntoViewIfNeeded();
      await expect(contact).toBeInViewport();
    }
  }
});

test("native first-time password setup rotates credentials, revokes other sessions and preserves password dates on terms-only acceptance", async ({ request }) => {
  const databaseUrl = configureTestDatabase();
  test.skip(!databaseUrl, "Requires disposable local setup accounts");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl! }) });
  const temporary = "Temporary-setup-password-2026!";
  const chosen = "A new chosen setup passphrase 2026!";
  const user = await db.user.create({ data: { fullName: "First-time setup owner", passwordHash: await bcrypt.hash(temporary, 10), mustChangePassword: true } });
  const org = await db.organization.create({ data: { name: "Setup workspace", slug: `setup-secure-${randomUUID()}` } });
  const member = await db.membership.create({ data: { userId: user.id, orgId: org.id, role: "OFFICE", scopeType: "ORG", scopeId: org.id } });
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 3600000);
  const name = process.env.TEST_SESSION_COOKIE_NAME ?? "estatedesk_session";
  await db.userSession.createMany({ data: [{ userId: user.id, activeMembershipId: member.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt }, { userId: user.id, activeMembershipId: member.id, tokenHash: randomBytes(32).toString("hex"), expiresAt }] });
  const headers = { "X-EstateDesk-Client": "native", Cookie: `${name}=${token}` };
  try {
    const result = await request.post("/api/mobile/account/setup", { headers, data: { currentPassword: temporary, newPassword: chosen, confirmPassword: chosen, acceptedTerms: true } });
    expect(result.status()).toBe(200);
    const body = await result.json();
    expect(body.sessionCookie).toMatch(new RegExp(`^${name}=v1\\.`));
    expect(await db.userSession.count({ where: { userId: user.id } })).toBe(1);
    expect((await request.get("/api/mobile/session", { headers })).status()).toBe(401);
    const renewed = { ...headers, Cookie: body.sessionCookie };
    expect((await request.get("/api/mobile/session", { headers: renewed })).status()).toBe(200);
    const changed = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(changed.mustChangePassword).toBe(false);
    expect(changed.termsAcceptedAt).not.toBeNull();
    expect(await bcrypt.compare(chosen, changed.passwordHash)).toBe(true);
    await db.user.update({ where: { id: user.id }, data: { termsAcceptedAt: null } });
    const accepted = await request.post("/api/mobile/account/setup", { headers: renewed, data: { currentPassword: "", newPassword: "", confirmPassword: "", acceptedTerms: true } });
    expect(accepted.status()).toBe(200);
    const termsOnly = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(termsOnly.passwordChangedAt?.toISOString()).toBe(changed.passwordChangedAt?.toISOString());
    expect(termsOnly.passwordHash).toBe(changed.passwordHash);
    expect(termsOnly.termsAcceptedAt).not.toBeNull();
  } finally {
    await db.auditLog.deleteMany({ where: { actorUserId: user.id } });
    await db.userSession.deleteMany({ where: { userId: user.id } });
    await db.rateLimitBucket.deleteMany({ where: { key: `account-password:${user.id}` } });
    await db.organization.delete({ where: { id: org.id } });
    await db.user.delete({ where: { id: user.id } });
    await db.$disconnect();
  }
});
