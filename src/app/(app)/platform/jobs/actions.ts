"use server";

import { NotificationStatus } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { runNotificationCron, runRetentionCron } from "@/lib/cron/jobs";
import { writePlatformAuditLog } from "@/lib/audit/security";
import { requirePlatformRole } from "@/lib/permissions/guards";

const JOBS_PATH = "/platform/jobs";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function refreshJobsPage() {
  revalidatePath(JOBS_PATH);
  revalidateTag("platform-jobs", "max");
}

export async function retryFailedNotificationAction(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });
  const notificationId = readString(formData, "notificationId");

  if (!notificationId) {
    throw new Error("Notification id is required.");
  }

  const result = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      status: NotificationStatus.FAILED,
    },
    data: {
      status: NotificationStatus.QUEUED,
      providerResponse: {
        retriedAt: new Date().toISOString(),
        retriedBy: session.userId,
      },
    },
  });

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "FAILED_NOTIFICATION_REQUEUED",
    entityType: "Notification",
    entityId: notificationId,
    metadata: { count: result.count },
  });

  refreshJobsPage();
}

export async function retryAllFailedNotificationsAction() {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const result = await prisma.notification.updateMany({
    where: { status: NotificationStatus.FAILED },
    data: {
      status: NotificationStatus.QUEUED,
      providerResponse: {
        retriedAt: new Date().toISOString(),
        retriedBy: session.userId,
      },
    },
  });

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "FAILED_NOTIFICATIONS_REQUEUED",
    entityType: "Notification",
    entityId: "failed-notifications",
    metadata: { count: result.count },
  });

  refreshJobsPage();
}

export async function runNotificationsJobAction() {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });
  const result = await runNotificationCron({
    triggerSource: "manual",
    actorUserId: session.userId,
  });

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "CRON_JOB_MANUALLY_RUN",
    entityType: "CronJob",
    entityId: "notifications",
    metadata: result,
  });

  refreshJobsPage();
}

export async function runRetentionJobAction() {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });
  const result = await runRetentionCron({
    triggerSource: "manual",
    actorUserId: session.userId,
  });

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "CRON_JOB_MANUALLY_RUN",
    entityType: "CronJob",
    entityId: "retention",
    metadata: {
      totalOrganizations: result.totalOrganizations,
      totalRecords: result.totalRecords,
      mode: result.mode,
    },
  });

  refreshJobsPage();
}
