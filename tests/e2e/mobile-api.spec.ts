import { readFile } from "node:fs/promises";
import { test, expect, type APIRequestContext } from "playwright/test";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { configureTestDatabase } from "../integration/database-safety";
import { hash } from "bcryptjs";

test.describe.configure({ mode: "serial" });
test.beforeEach(({}, info) => { test.skip(!process.env.ROLE_WORKSPACE_FIXTURE || info.project.name !== "chromium", "Requires disposable local accounts; native API runs once"); });
const native = { "X-EstateDesk-Client": "native" };
async function login(request: APIRequestContext, role: string, override?: { email: string; password: string }) {
  const fixture = JSON.parse(await readFile(process.env.ROLE_WORKSPACE_FIXTURE!, "utf8"));
  const account = override ?? fixture.accounts[role];
  const response = await request.post("/api/mobile/login", { headers: native, data: { email: account.email, password: account.password } });
  expect(response.status(), await response.text()).toBe(200);
  const { sessionCookie } = await response.json();
  return { fixture, headers: { ...native, Cookie: sessionCookie } };
}

test("native API rejects browser transport, oversized input, and anonymous reads", async ({ request }) => {
  expect((await request.post("/api/mobile/login", { headers: { ...native, Origin: "https://attacker.test" }, data: {} })).status()).toBe(403);
  expect((await request.post("/api/mobile/login", { headers: { ...native, "Content-Type": "application/json" }, data: `{"password":"${"x".repeat(17000)}"}` })).status()).toBe(413);
  const denied = await request.get("/api/mobile/session", { headers: native });
  expect([401, 307]).toContain(denied.status());
});

test("native tenant issues, memberships, notification ownership and logout enforce resource boundaries", async ({ request }) => {
  test.setTimeout(120000);
  const { headers, fixture } = await login(request, "TENANT");
  const profile = await request.get("/api/mobile/session", { headers });
  expect((await profile.json()).role).toBe("TENANT");
  expect(profile.headers()["cache-control"]).toContain("no-store");
  const memberships = await (await request.get("/api/mobile/memberships", { headers })).json();
  expect(memberships.length).toBeGreaterThan(0);
  expect((await request.post("/api/mobile/memberships", { headers, data: { membershipId: "someone-elses-membership" } })).status()).toBe(403);
  expect((await request.post("/api/mobile/memberships", { headers, data: { membershipId: memberships[0].id } })).status()).toBe(200);
  const issues = await (await request.get("/api/mobile/tenant/issues", { headers })).json();
  expect(issues.units.length).toBeGreaterThan(0);
  expect((await request.post("/api/mobile/tenant/issues", { headers, data: { unitId: "foreign-unit", title: "A leak", description: "Bathroom tap leaking", priority: "MEDIUM" } })).status()).toBe(403);
  const title = `Native maintenance ${Date.now()}`;
  const created = await request.post("/api/mobile/tenant/issues", { headers, data: { unitId: issues.units[0].id, title, description: "Bathroom tap leaking", priority: "MEDIUM" } });
  expect(created.status(), await created.text()).toBe(200);
  expect((await (await request.get("/api/mobile/tenant/issues", { headers })).json()).issues.some((item: { title: string }) => item.title === title)).toBe(true);
  expect((await request.get("/api/mobile/caretaker/meters", { headers })).status()).toBe(403);
  expect((await request.post("/api/mobile/notifications", { headers, data: { id: "foreign-notification" } })).status()).toBe(404);
  expect((await request.post("/api/mobile/tenant/payments", { headers, data: { source: "period_bill", id: "2026-10", method: "manual-mpesa", amount: -1 } })).status()).toBe(400);
  const url = configureTestDatabase()!;
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  try {
    await db.issueTicket.deleteMany({ where: { orgId: fixture.orgId, title } });
  } finally { await db.$disconnect(); }
  expect((await request.post("/api/mobile/logout", { headers })).status()).toBe(200);
  expect((await request.get("/api/mobile/session", { headers, maxRedirects: 0 })).status()).toBe(401);
});

test("native account setup validates terms and current password", async ({ request }) => {
  const fixture = JSON.parse(await readFile(process.env.ROLE_WORKSPACE_FIXTURE!, "utf8"));
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: configureTestDatabase()! }) });
  const password = "Temporary-native-test-2026!";
  const email = `native-setup-${Date.now()}@example.test`;
  const user = await db.user.create({ data: { fullName: "Native setup test", email, passwordHash: await hash(password, 10), mustChangePassword: true } });
  try {
  await db.membership.create({ data: { userId: user.id, orgId: fixture.orgId, role: "OFFICE" } });
  const { headers } = await login(request, "PASSWORD_CHANGE", { email, password });
  expect((await request.get("/api/mobile/tenant/issues", { headers })).status()).toBe(403);
  expect((await request.post("/api/mobile/account/setup", { headers, data: { currentPassword: "wrong", newPassword: "A-valid-test-password-2026!", confirmPassword: "A-valid-test-password-2026!", acceptedTerms: false } })).status()).toBe(400);
  const denied = await request.post("/api/mobile/account/setup", { headers, data: { currentPassword: "wrong", newPassword: "A-valid-test-password-2026!", confirmPassword: "A-valid-test-password-2026!", acceptedTerms: true } });
  expect(denied.status()).toBe(400);
  expect((await denied.json()).error).toContain("incorrect");
  const accepted = await request.post("/api/mobile/account/setup", { headers, data: { currentPassword: password, newPassword: "A-valid-test-password-2026!", confirmPassword: "A-valid-test-password-2026!", acceptedTerms: true } });
  expect(accepted.status(), await accepted.text()).toBe(200);
  expect((await (await request.get("/api/mobile/session", { headers })).json()).requiresAccountSetup).toBe(false);
  await request.post("/api/mobile/logout", { headers });
  } finally { await db.membership.deleteMany({ where: { userId: user.id } }); await db.user.delete({ where: { id: user.id } }); await db.$disconnect(); }
});

test("native manual payments stay pending and assigned meter submissions await organization approval", async ({ request }) => {
  test.setTimeout(120000);
  const fixture = JSON.parse(await readFile(process.env.ROLE_WORKSPACE_FIXTURE!, "utf8"));
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: configureTestDatabase()! }) });
  const settings = await db.organizationSettings.findUnique({ where: { orgId: fixture.orgId } });
  const tenant = await db.tenant.findFirstOrThrow({ where: { orgId: fixture.orgId, userId: fixture.accounts.TENANT.id } });
  const property = await db.property.findFirstOrThrow({ where: { orgId: fixture.orgId } });
  const unit = await db.unit.create({ data: { propertyId: property.id, houseNo: `Native-${Date.now()}`, status: "OCCUPIED", rentAmount: 100 } });
  const lease = await db.lease.create({ data: { orgId: fixture.orgId, tenantId: tenant.id, unitId: unit.id, startDate: new Date(), monthlyRent: 100 } });
  const period = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit" }).format(new Date()).replace("/", "-");
  const charge = await db.rentCharge.create({ data: { orgId: fixture.orgId, leaseId: lease.id, period, chargeType: "RENT", amountDue: 100, balance: 100, amountPaid: 0, dueDate: new Date() } });
  try {
    await db.organizationSettings.upsert({ where: { orgId: fixture.orgId }, create: { orgId: fixture.orgId, customFields: { paymentInstructions: { mpesaEnabled: true, mpesaPaybill: "123456", mpesaAccountNumber: "TEST" } } }, update: { customFields: { paymentInstructions: { mpesaEnabled: true, mpesaPaybill: "123456", mpesaAccountNumber: "TEST" } } } });
    const tenantLogin = await login(request, "TENANT");
    const payment = { source: "rent_charge", id: charge.id, method: "manual-mpesa", amount: 25.25, phoneNumber: "254700000001", transactionId: "TEST123456" };
    const submitted = await request.post("/api/mobile/tenant/payments", { headers: tenantLogin.headers, data: payment });
    expect(submitted.status(), await submitted.text()).toBe(200);
    expect((await db.rentCharge.findUniqueOrThrow({ where: { id: charge.id } })).balance.toFixed(2)).toBe("100.00");
    expect((await db.payment.findFirstOrThrow({ where: { rentChargeId: charge.id } })).verificationStatus).toBe("PENDING");
    const history = await (await request.get("/api/mobile/tenant/payments/history", { headers: tenantLogin.headers })).json();
    expect(history.some((item: { amount: number; verificationStatus: string }) => item.amount === 25.25 && item.verificationStatus === "PENDING")).toBe(true);
    await request.post("/api/mobile/logout", { headers: tenantLogin.headers });
    await db.caretakerAssignment.create({ data: { orgId: fixture.orgId, caretakerUserId: fixture.accounts.CARETAKER.id, unitId: unit.id } });
    const caretaker = await login(request, "CARETAKER");
    const meters = await (await request.get("/api/mobile/caretaker/meters", { headers: caretaker.headers })).json();
    expect(meters.units.some((item: { id: string }) => item.id === unit.id)).toBe(true);
    const reading = { unitId: unit.id, period: meters.period, currentReading: 50, notes: "Local API test" };
    expect((await request.post("/api/mobile/caretaker/meters", { headers: caretaker.headers, data: { ...reading, unitId: "unassigned-unit" } })).status()).toBe(400);
    const saved = await request.post("/api/mobile/caretaker/meters", { headers: caretaker.headers, data: reading });
    expect(saved.status(), await saved.text()).toBe(200);
    expect((await db.waterBill.findUniqueOrThrow({ where: { unitId_period: { unitId: unit.id, period: meters.period } } })).status).toBe("PENDING_APPROVAL");
    expect((await request.post("/api/mobile/caretaker/meters", { headers: caretaker.headers, data: reading })).status()).toBe(400);
    await request.post("/api/mobile/logout", { headers: caretaker.headers });
  } finally {
    await db.payment.deleteMany({ where: { rentChargeId: charge.id } });
    await db.waterBill.deleteMany({ where: { unitId: unit.id } });
    await db.meterReading.deleteMany({ where: { unitId: unit.id } });
    await db.caretakerAssignment.deleteMany({ where: { unitId: unit.id } });
    await db.rentCharge.delete({ where: { id: charge.id } }); await db.lease.delete({ where: { id: lease.id } }); await db.unit.delete({ where: { id: unit.id } });
    if (settings) await db.organizationSettings.update({ where: { orgId: fixture.orgId }, data: { customFields: settings.customFields ?? Prisma.DbNull } });
    else await db.organizationSettings.deleteMany({ where: { orgId: fixture.orgId } });
    await db.$disconnect();
  }
});
