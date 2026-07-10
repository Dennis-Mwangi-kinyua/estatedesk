"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";

const CARETAKER_NOTIFICATIONS_PATH = "/dashboard/caretaker/notifications";

async function requireCaretakerNotificationContext() {
  const session = await requireUserSession();

  if (!session.activeOrgId || session.activeOrgRole !== "CARETAKER") {
    throw new Error("Caretaker access is required.");
  }

  return session;
}

export async function markCaretakerNotificationReadAction(formData: FormData) {
  const session = await requireCaretakerNotificationContext();
  const notificationId = String(formData.get("notificationId") ?? "").trim();

  if (!notificationId) {
    return;
  }

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      orgId: session.activeOrgId!,
      userId: session.userId,
    },
    data: {
      readAt: new Date(),
    },
  });

  revalidatePath(CARETAKER_NOTIFICATIONS_PATH);
}

export async function markAllCaretakerNotificationsReadAction() {
  const session = await requireCaretakerNotificationContext();

  await prisma.notification.updateMany({
    where: {
      orgId: session.activeOrgId!,
      userId: session.userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  revalidatePath(CARETAKER_NOTIFICATIONS_PATH);
}
