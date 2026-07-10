"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import {
  PlatformPermissionType,
  PlatformRole,
  UserStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ALL_PLATFORM_PERMISSIONS } from "./constants";
import { normalizeUsername } from "./helpers";

export async function createPlatformAdmin(formData: FormData) {
  "use server";

  const fullName = String(formData.get("fullName") ?? "").trim();
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const platformRoleRaw = String(formData.get("platformRole") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "").trim();

  const canCreatePlatformAdmins =
    String(formData.get("canCreatePlatformAdmins") ?? "") === "on";

  const isRootSuperAdmin =
    String(formData.get("isRootSuperAdmin") ?? "") === "on";

  const selectedPermissions = formData
    .getAll("permissions")
    .map((value) => String(value))
    .filter((value): value is PlatformPermissionType =>
      ALL_PLATFORM_PERMISSIONS.includes(value as PlatformPermissionType),
    );

  const platformRole = Object.values(PlatformRole).includes(
    platformRoleRaw as PlatformRole,
  )
    ? (platformRoleRaw as PlatformRole)
    : PlatformRole.PLATFORM_ADMIN;

  const status = Object.values(UserStatus).includes(statusRaw as UserStatus)
    ? (statusRaw as UserStatus)
    : UserStatus.ACTIVE;

  if (!fullName) {
    throw new Error("Full name is required.");
  }

  if (!username) {
    throw new Error("Username is required.");
  }

  if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    throw new Error(
      "Username must be 3-30 characters and can only contain letters, numbers, dots, underscores, and hyphens.",
    );
  }

  if (!email) {
    throw new Error("Email is required.");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  if (isRootSuperAdmin && platformRole !== PlatformRole.SUPER_ADMIN) {
    throw new Error("Root super admin must have SUPER_ADMIN role.");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        { email },
        ...(phoneRaw ? [{ phone: phoneRaw }] : []),
      ],
    },
    select: {
      id: true,
      username: true,
      email: true,
      phone: true,
    },
  });

  if (existingUser?.username === username) {
    throw new Error("A user with that username already exists.");
  }

  if (existingUser?.email === email) {
    throw new Error("A user with that email already exists.");
  }

  if (phoneRaw && existingUser?.phone === phoneRaw) {
    throw new Error("A user with that phone number already exists.");
  }

  const passwordHash = await hash(password, 12);
  const verifiedAt = new Date();

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        fullName,
        username,
        email,
        phone: phoneRaw || null,
        passwordHash,
        status,
        platformRole,
        canCreatePlatformAdmins,
        isRootSuperAdmin,
        emailVerified: verifiedAt,
        phoneVerified: phoneRaw ? verifiedAt : null,
      },
      select: {
        id: true,
      },
    });

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

  revalidatePath("/platform/admins");
}

export async function deletePlatformAdmin(formData: FormData) {
  "use server";

  const userId = String(formData.get("userId") ?? "").trim();

  if (!userId) {
    throw new Error("Missing user id.");
  }

  // Soft-delete the user by setting `deletedAt` so the record is excluded
  // from normal queries without permanently removing it.
  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/platform/admins");
}

