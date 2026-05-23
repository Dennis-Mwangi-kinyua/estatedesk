"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTenantAccess } from "@/lib/permissions/guards";

const TENANT_NOTIFICATIONS_PATH = "/tenants/notifications";

async function requireTenantContext() {
  const session = await requireTenantAccess();

  if (!session.userId || !session.activeOrgId) {
    throw new Error("Missing tenant session context.");
  }

  const tenant = await prisma.tenant.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId,
      deletedAt: null,
    },
    select: {
      id: true,
      orgId: true,
    },
  });

  if (!tenant) {
    throw new Error("Tenant profile not found.");
  }

  return { session, tenant };
}

export async function markTenantNotificationReadAction(formData: FormData) {
  const { session, tenant } = await requireTenantContext();
  const notificationId = String(formData.get("notificationId") ?? "");

  if (!notificationId) {
    throw new Error("Missing notification id.");
  }

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      orgId: tenant.orgId,
      OR: [{ tenantId: tenant.id }, { userId: session.userId }],
    },
    data: {
      readAt: new Date(),
      status: "SENT",
      sentAt: new Date(),
    },
  });

  revalidatePath(TENANT_NOTIFICATIONS_PATH);
  revalidatePath("/dashboard/tenant/notices");
}

export async function markAllTenantNotificationsReadAction() {
  const { session, tenant } = await requireTenantContext();

  await prisma.notification.updateMany({
    where: {
      orgId: tenant.orgId,
      readAt: null,
      OR: [{ tenantId: tenant.id }, { userId: session.userId }],
    },
    data: {
      readAt: new Date(),
      status: "SENT",
      sentAt: new Date(),
    },
  });

  revalidatePath(TENANT_NOTIFICATIONS_PATH);
  revalidatePath("/dashboard/tenant/notices");
}
