"use server";

import { hash } from "bcryptjs";
import {
  PlatformPermissionType,
  PlatformRole,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { writePlatformAuditLog } from "@/lib/audit/security";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { sendSecurityAlert } from "@/lib/security/alerts";

const USER_STATUSES = ["ACTIVE", "SUSPENDED", "DISABLED"] as const;
const PLATFORM_PERMISSIONS = Object.values(PlatformPermissionType);

function getRequiredString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getUserPath(user: { id: string; username: string | null }) {
  return `/platform/users/${user.username ?? user.id}`;
}

export async function updatePlatformUserStatus(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/login",
  });

  const userId = getRequiredString(formData, "userId");
  const status = getRequiredString(formData, "status").toUpperCase();

  if (!userId || !USER_STATUSES.includes(status as (typeof USER_STATUSES)[number])) {
    redirect("/platform/users");
  }

  if (userId === session.userId) {
    redirect(`/platform/users/${userId}?error=self-status`);
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, username: true, email: true, status: true, isRootSuperAdmin: true },
  });

  if (!user) {
    redirect("/platform/users");
  }

  if (user.isRootSuperAdmin) {
    redirect(getUserPath(user) + "?error=root-protected");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: status as (typeof USER_STATUSES)[number] },
  });

  if (status !== "ACTIVE") {
    await prisma.userSession.deleteMany({ where: { userId } });
  }

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_USER_STATUS_UPDATED",
    entityType: "User",
    entityId: userId,
    beforeState: {
      status: user.status,
    },
    afterState: {
      status,
    },
    metadata: {
      username: user.username,
      email: user.email,
    },
  });

  await sendSecurityAlert({
    event: "PLATFORM_USER_STATUS_UPDATED",
    severity: status === "ACTIVE" ? "warning" : "critical",
    actorUserId: session.userId,
    entityType: "User",
    entityId: userId,
    summary: `${session.fullName} changed ${user.username ?? user.email ?? userId} status from ${user.status} to ${status}.`,
    metadata: {
      username: user.username,
      email: user.email,
      beforeStatus: user.status,
      afterStatus: status,
    },
  });

  revalidatePath("/platform/users");
  revalidatePath(`/platform/users/${userId}`);
  redirect(getUserPath(user) + "?updated=status");
}

export async function updatePlatformUserProfile(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/login",
  });

  const userId = getRequiredString(formData, "userId");
  const fullName = getRequiredString(formData, "fullName");
  const username = getRequiredString(formData, "username").toLowerCase();
  const email = getRequiredString(formData, "email").toLowerCase();
  const phone = getRequiredString(formData, "phone").replace(/\s+/g, "") || null;
  const roleRaw = getRequiredString(formData, "platformRole").toUpperCase();
  const platformRole = Object.values(PlatformRole).includes(roleRaw as PlatformRole)
    ? (roleRaw as PlatformRole)
    : PlatformRole.USER;
  const canCreatePlatformAdmins =
    String(formData.get("canCreatePlatformAdmins") ?? "") === "on";

  if (!userId || !fullName || !username || !email) {
    redirect("/platform/users");
  }

  if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    redirect(`/platform/users/${userId}?error=username`);
  }

  if (platformRole === "SUPER_ADMIN" && session.platformRole !== "SUPER_ADMIN") {
    redirect(`/platform/users/${userId}?error=super-admin`);
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      fullName: true,
      username: true,
      email: true,
      phone: true,
      platformRole: true,
      canCreatePlatformAdmins: true,
      isRootSuperAdmin: true,
    },
  });

  if (!user) redirect("/platform/users");
  if (user.isRootSuperAdmin && session.platformRole !== "SUPER_ADMIN") {
    redirect(getUserPath(user) + "?error=root-protected");
  }

  const duplicate = await prisma.user.findFirst({
    where: {
      id: { not: userId },
      OR: [{ username }, { email }, ...(phone ? [{ phone }] : [])],
    },
    select: { id: true },
  });

  if (duplicate) {
    redirect(getUserPath(user) + "?error=duplicate");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      fullName,
      username,
      email,
      phone,
      platformRole,
      canCreatePlatformAdmins,
    },
  });

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_USER_PROFILE_UPDATED",
    entityType: "User",
    entityId: userId,
    beforeState: {
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      platformRole: user.platformRole,
      canCreatePlatformAdmins: user.canCreatePlatformAdmins,
    },
    afterState: {
      fullName,
      username,
      email,
      phone,
      platformRole,
      canCreatePlatformAdmins,
    },
  });

  if (
    user.platformRole !== platformRole ||
    user.canCreatePlatformAdmins !== canCreatePlatformAdmins
  ) {
    await sendSecurityAlert({
      event: "PLATFORM_USER_ROLE_UPDATED",
      severity: platformRole === "SUPER_ADMIN" ? "critical" : "warning",
      actorUserId: session.userId,
      entityType: "User",
      entityId: userId,
      summary: `${session.fullName} updated platform role for ${username}.`,
      metadata: {
        beforeRole: user.platformRole,
        afterRole: platformRole,
        beforeCanCreatePlatformAdmins: user.canCreatePlatformAdmins,
        afterCanCreatePlatformAdmins: canCreatePlatformAdmins,
      },
    });
  }

  revalidatePath("/platform/users");
  revalidatePath(`/platform/users/${userId}`);
  redirect(`/platform/users/${username}?updated=profile`);
}

export async function updatePlatformUserPermissions(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/login",
  });
  const userId = getRequiredString(formData, "userId");
  const selectedPermissions = formData
    .getAll("permissions")
    .map((value) => String(value))
    .filter((value): value is PlatformPermissionType =>
      PLATFORM_PERMISSIONS.includes(value as PlatformPermissionType),
    );

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      username: true,
      platformPermissions: {
        select: { permission: true, granted: true },
      },
    },
  });

  if (!user) redirect("/platform/users");

  await prisma.$transaction(async (tx) => {
    await tx.platformPermission.deleteMany({ where: { userId } });
    if (selectedPermissions.length > 0) {
      await tx.platformPermission.createMany({
        data: selectedPermissions.map((permission) => ({
          userId,
          permission,
          granted: true,
        })),
      });
    }
  });

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_USER_PERMISSIONS_UPDATED",
    entityType: "User",
    entityId: userId,
    beforeState: {
      permissions: user.platformPermissions,
    },
    afterState: {
      permissions: selectedPermissions,
    },
  });

  await sendSecurityAlert({
    event: "PLATFORM_USER_PERMISSIONS_UPDATED",
    severity: "warning",
    actorUserId: session.userId,
    entityType: "User",
    entityId: userId,
    summary: `${session.fullName} updated platform permissions for ${user.username ?? userId}.`,
    metadata: {
      permissions: selectedPermissions,
    },
  });

  revalidatePath("/platform/users");
  revalidatePath(`/platform/users/${userId}`);
  redirect(getUserPath(user) + "?updated=permissions");
}

export async function resetPlatformUserPassword(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/login",
  });
  const userId = getRequiredString(formData, "userId");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8 || password !== confirmPassword) {
    redirect(`/platform/users/${userId}?error=password`);
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, username: true, email: true, isRootSuperAdmin: true },
  });

  if (!user) redirect("/platform/users");
  if (user.isRootSuperAdmin && session.platformRole !== "SUPER_ADMIN") {
    redirect(getUserPath(user) + "?error=root-protected");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hash(password, 12),
      mustChangePassword: true,
      passwordChangedAt: null,
    },
  });
  await prisma.userSession.deleteMany({ where: { userId } });

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_USER_PASSWORD_RESET",
    entityType: "User",
    entityId: userId,
    metadata: {
      username: user.username,
      email: user.email,
      forcedPasswordChange: true,
    },
  });

  await sendSecurityAlert({
    event: "PLATFORM_USER_PASSWORD_RESET",
    severity: "critical",
    actorUserId: session.userId,
    entityType: "User",
    entityId: userId,
    summary: `${session.fullName} reset a platform user's password.`,
    metadata: {
      username: user.username,
      email: user.email,
      forcedPasswordChange: true,
    },
  });

  revalidatePath(`/platform/users/${userId}`);
  redirect(getUserPath(user) + "?updated=password");
}

export async function archiveOrphanPlatformUser(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/login",
  });

  const userId = getRequiredString(formData, "userId");
  const confirmation = getRequiredString(formData, "confirmation");

  if (!userId) {
    redirect("/platform/users");
  }

  if (userId === session.userId) {
    redirect(`/platform/users/${userId}?error=self-archive`);
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      fullName: true,
      username: true,
      email: true,
      isRootSuperAdmin: true,
      memberships: { select: { id: true }, take: 1 },
      platformPermissions: { select: { id: true }, take: 1 },
    },
  });

  if (!user) {
    redirect("/platform/users");
  }

  if (user.isRootSuperAdmin) {
    redirect(`/platform/users/${userId}?error=root-protected`);
  }

  if (user.memberships.length > 0 || user.platformPermissions.length > 0) {
    redirect(`/platform/users/${userId}?error=not-orphan`);
  }

  const expectedConfirmation = user.username || user.email || user.fullName;
  if (confirmation !== expectedConfirmation) {
    redirect(`/platform/users/${userId}?error=confirm-archive`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.userSession.deleteMany({ where: { userId } });
    await tx.user.update({
      where: { id: userId },
      data: {
        status: "DISABLED",
        deletedAt: new Date(),
      },
    });
  });

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_USER_DELETED",
    entityType: "User",
    entityId: userId,
    beforeState: {
      fullName: user.fullName,
      username: user.username,
      email: user.email,
    },
    metadata: {
      deletionMode: "soft_delete_orphan",
    },
  });

  await sendSecurityAlert({
    event: "PLATFORM_USER_DELETED",
    severity: "critical",
    actorUserId: session.userId,
    entityType: "User",
    entityId: userId,
    summary: `${session.fullName} archived orphan platform user ${expectedConfirmation}.`,
    metadata: {
      deletionMode: "soft_delete_orphan",
      username: user.username,
      email: user.email,
    },
  });

  revalidatePath("/platform/users");
  redirect(`/platform/users?archived=${encodeURIComponent(expectedConfirmation)}`);
}
