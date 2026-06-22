"use server";

import { hash } from "bcryptjs";
import {
  PlatformPermissionType,
  PlatformRole,
  UserStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { writePlatformAuditLog } from "@/lib/audit/security";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { sendSecurityAlert } from "@/lib/security/alerts";

const ALL_PLATFORM_PERMISSIONS = Object.values(PlatformPermissionType);

function normalizeUsername(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, "");
}

function normalizePhone(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().replace(/\s+/g, "") || null;
}

function parsePlatformRole(value: FormDataEntryValue | null) {
  const role = String(value ?? "").trim().toUpperCase();
  return Object.values(PlatformRole).includes(role as PlatformRole)
    ? (role as PlatformRole)
    : PlatformRole.USER;
}

export async function createPlatformUserAction(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/login",
  });

  const fullName = String(formData.get("fullName") ?? "").trim();
  const username = normalizeUsername(formData.get("username"));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = normalizePhone(formData.get("phone"));
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const platformRole = parsePlatformRole(formData.get("platformRole"));
  const canCreatePlatformAdmins =
    String(formData.get("canCreatePlatformAdmins") ?? "") === "on";
  const selectedPermissions = formData
    .getAll("permissions")
    .map((value) => String(value))
    .filter((value): value is PlatformPermissionType =>
      ALL_PLATFORM_PERMISSIONS.includes(value as PlatformPermissionType),
    );

  if (!fullName || !username || !email) {
    redirect("/platform/users?createError=missing");
  }

  if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    redirect("/platform/users?createError=username");
  }

  if (password.length < 8 || password !== confirmPassword) {
    redirect("/platform/users?createError=password");
  }

  if (platformRole === PlatformRole.SUPER_ADMIN && session.platformRole !== "SUPER_ADMIN") {
    redirect("/platform/users?createError=super-admin");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }, ...(phone ? [{ phone }] : [])],
    },
    select: { username: true, email: true, phone: true },
  });

  if (existingUser) {
    redirect("/platform/users?createError=duplicate");
  }

  const passwordHash = await hash(password, 12);
  const verifiedAt = new Date();
  let createdUserId: string | null = null;

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        fullName,
        username,
        email,
        phone,
        passwordHash,
        status: UserStatus.ACTIVE,
        platformRole,
        canCreatePlatformAdmins,
        mustChangePassword: true,
        emailVerified: verifiedAt,
        phoneVerified: phone ? verifiedAt : null,
        createdByUserId: session.userId,
      },
      select: { id: true },
    });
    createdUserId = user.id;

    if (selectedPermissions.length > 0) {
      await tx.platformPermission.createMany({
        data: selectedPermissions.map((permission) => ({
          userId: user.id,
          permission,
          granted: true,
        })),
      });
    }
  });

  if (createdUserId) {
    await writePlatformAuditLog({
      actorUserId: session.userId,
      action: "PLATFORM_USER_CREATED",
      entityType: "User",
      entityId: createdUserId,
      metadata: {
        fullName,
        username,
        email,
        platformRole,
        canCreatePlatformAdmins,
        permissions: selectedPermissions,
      },
    });

    await sendSecurityAlert({
      event: "PLATFORM_USER_CREATED",
      severity: platformRole === "SUPER_ADMIN" ? "critical" : "warning",
      actorUserId: session.userId,
      entityType: "User",
      entityId: createdUserId,
      summary: `${session.fullName} created platform user ${username} with role ${platformRole}.`,
      metadata: {
        username,
        email,
        platformRole,
        canCreatePlatformAdmins,
        permissions: selectedPermissions,
      },
    });
  }

  revalidatePath("/platform/users");
  redirect("/platform/users?created=1");
}
