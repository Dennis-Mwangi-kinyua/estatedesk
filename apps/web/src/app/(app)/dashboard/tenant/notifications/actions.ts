"use server";

import { readPersonalNotification, readAllPersonalNotifications } from "@/lib/notifications/read";

import { revalidatePath } from "next/cache";
import { requireTenantAccess } from "@/lib/permissions/guards";

export async function markTenantNotificationReadAction(formData: FormData) {
  const session = await requireTenantAccess();
  const id = String(formData.get("notificationId") ?? "").trim();
  if (!id) throw new Error("Missing notification id.");
  await readPersonalNotification(session, id);
  revalidatePath("/", "layout");
}

export async function markAllTenantNotificationsReadAction() {
  const session = await requireTenantAccess();
  await readAllPersonalNotifications(session);
  revalidatePath("/", "layout");
}
