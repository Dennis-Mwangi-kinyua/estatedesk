import { writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { configureTestDatabase } from "../../tests/integration/database-safety";
import { ROLE_HOME_PATHS } from "../../apps/web/src/lib/auth/redirect-after-login";

async function main() {
  if (!configureTestDatabase()) throw new Error("TEST_DATABASE_URL required");
  const { fixture } = await import("../../tests/integration/move-out-fixture");
  const f = await fixture();
  const password = "Local-verification-2026!";
  const passwordHash = await hash(password, 10);
  await f.prisma.subscription.create({ data: { orgId: f.org.id, plan: "ENTERPRISE", status: "ACTIVE", currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 30 * 86400000) } });
  const accounts: Record<string, { id: string; email: string; password: string; home: string }> = {};
  for (const [role, home] of Object.entries(ROLE_HOME_PATHS)) {
    const user = await f.prisma.user.create({ data: { email: `verify-${role.toLowerCase()}-${f.org.id}@example.test`, fullName: `Verification ${role}`, passwordHash, termsAcceptedAt: new Date() } });
    await f.prisma.membership.create({ data: { orgId: f.org.id, userId: user.id, role: role as keyof typeof ROLE_HOME_PATHS } });
    accounts[role] = { id: user.id, email: user.email!, password, home };
    if (role === "TENANT") await f.prisma.tenant.update({ where: { id: f.tenant.id }, data: { userId: user.id } });
    if (role === "LANDLORD") await f.prisma.landlordProfile.create({ data: { orgId: f.org.id, userId: user.id, displayName: user.fullName, assignments: { create: { orgId: f.org.id, propertyId: f.unit.propertyId } } } });
  }
  for (const role of ["PLATFORM_ADMIN", "PROVIDER", "PASSWORD_CHANGE", "INVITEE", "EXPIRED_SESSION"] as const) {
    const user = await f.prisma.user.create({ data: { email: `verify-${role.toLowerCase()}-${f.org.id}@example.test`, fullName: `Verification ${role}`, passwordHash, platformRole: role === "PLATFORM_ADMIN" ? "PLATFORM_ADMIN" : "USER", termsAcceptedAt: new Date(), mustChangePassword: role === "PASSWORD_CHANGE" } });
    accounts[role] = { id: user.id, email: user.email!, password, home: role === "PLATFORM_ADMIN" ? "/platform" : role === "PROVIDER" ? "/provider" : "/dashboard/org/tenants" };
    if (["PASSWORD_CHANGE", "EXPIRED_SESSION"].includes(role)) await f.prisma.membership.create({ data: { orgId: f.org.id, userId: user.id, role: "OFFICE" } });
    if (role === "PROVIDER") await f.prisma.serviceProvider.create({ data: { userId: user.id, businessName: "Verification plumbing", category: "Plumbing", location: "Nairobi", bio: "Local disposable test provider profile." } });
  }
  const token = randomBytes(32).toString("hex");
  const { hashOpaqueToken } = await import("../../apps/web/src/lib/crypto/tokens");
  await f.prisma.invitation.create({ data: { orgId: f.org.id, email: accounts.INVITEE.email, role: "OFFICE", token: hashOpaqueToken(token, "invitation"), invitedById: accounts.ADMIN.id, expiresAt: new Date(Date.now() + 86400000) } });
  await writeFile("/tmp/estatedesk-role-workspaces.json", JSON.stringify({ orgId: f.org.id, accounts, invitationToken: token }), { mode: 0o600 });
  await f.prisma.$disconnect();
  console.log("Disposable role-workspace fixture created.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
