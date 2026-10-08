"use server";

import { readPersonalNotification, readAllPersonalNotifications } from "@/lib/notifications/read";

import { revalidatePath } from "next/cache";
import { requireUserSession } from "@/lib/auth/session";


async function requireCaretakerNotificationContext() {
  const session = await requireUserSession();

  if (!session.activeOrgId || session.activeOrgRole !== "CARETAKER") {
    throw new Error("Caretaker access is required.");
  }

  return session;
}

export async function markCaretakerNotificationReadAction(formData: FormData) {
  const session = await requireCaretakerNotificationContext();
  const id = String(formData.get("notificationId") ?? "").trim();
  if (!id) throw new Error("Missing notification id.");
  await readPersonalNotification(session, id);
  revalidatePath("/", "layout");
}

export async function markAllCaretakerNotificationsReadAction() {
  const session = await requireCaretakerNotificationContext();
  await readAllPersonalNotifications(session);
  revalidatePath("/", "layout");
}
