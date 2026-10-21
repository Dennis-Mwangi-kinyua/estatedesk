"use server";
import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireOrgRole } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { assertCanCreateStaffUser } from "@/lib/billing/access";
import { createAccountSetupUrl } from "@/lib/auth/account-setup";
import { accountLoginUrl } from "@/lib/notifications/account-login-url";
import type { CreatedAccountLogin } from "@/lib/notifications/recipient-message";

export type SecurityAccountState = { error?: string; credentials?: CreatedAccountLogin };
export async function createSecurityAccount(_state: SecurityAccountState, form: FormData): Promise<SecurityAccountState> {
  const session = await requireOrgRole(["ADMIN", "MANAGER"]);
  const orgId = session.activeOrgId!;
  const fullName = String(form.get("fullName") ?? "").trim();
  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const propertyId = String(form.get("propertyId") ?? "");
  if (fullName.length < 2 || fullName.length > 120) return { error: "Enter the security officer's name (2–120 characters)." };
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) return { error: "Use a username of 3–30 letters, numbers, dots, underscores or hyphens." };
  const property = await prisma.property.findFirst({ where: { id: propertyId, orgId, deletedAt: null }, select: { id: true } });
  if (!property) return { error: "Choose a property in your organization." };
  try { await assertCanCreateStaffUser(orgId); }
  catch (error) { return { error: error instanceof Error ? error.message : "Staff account limit reached." }; }
  const password = randomBytes(18).toString("base64url");
  const passwordHash = await hash(password, 12);
  let setupUrl = "";
  try {
    await prisma.$transaction(async tx => {
      const user = await tx.user.create({ data: { fullName, username, passwordHash, mustChangePassword: true, createdByUserId: session.userId } });
      setupUrl = await createAccountSetupUrl(tx, user.id);
      const membership = await tx.membership.create({ data: { orgId, userId: user.id, role: "SECURITY", scopeType: "PROPERTY", scopeId: property.id } });
      await tx.gateAssignment.create({ data: { orgId, userId: user.id, propertyId: property.id } });
      await tx.auditLog.create({ data: { orgId, actorUserId: session.userId, action: "SECURITY_ACCOUNT_CREATED", entityType: "Membership", entityId: membership.id, metadata: { propertyId: property.id, username } } });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "This username is already taken. Choose another username." };
    console.error("[SecurityAccount] account creation failed", error);
    return { error: "Could not create the security account. Please try again." };
  }
  revalidatePath("/dashboard/gate");
  revalidatePath("/dashboard/tenant", "layout");
  revalidatePath("/staff");
  return { credentials: { fullName, username, setupUrl, role: "Security", loginUrl: accountLoginUrl() } };
}
