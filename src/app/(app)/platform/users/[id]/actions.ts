"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";

const USER_STATUSES = ["ACTIVE", "SUSPENDED", "DISABLED"] as const;

function getRequiredString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
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
    select: { id: true, isRootSuperAdmin: true },
  });

  if (!user) {
    redirect("/platform/users");
  }

  if (user.isRootSuperAdmin) {
    redirect(`/platform/users/${userId}?error=root-protected`);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: status as (typeof USER_STATUSES)[number] },
  });

  if (status !== "ACTIVE") {
    await prisma.userSession.deleteMany({ where: { userId } });
  }

  revalidatePath("/platform/users");
  revalidatePath(`/platform/users/${userId}`);
  redirect(`/platform/users/${userId}?updated=status`);
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

  revalidatePath("/platform/users");
  redirect(`/platform/users?archived=${encodeURIComponent(expectedConfirmation)}`);
}
