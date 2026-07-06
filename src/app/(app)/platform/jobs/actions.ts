"use server";

import { NotificationStatus } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { prisma } from "@/lib/prisma";
import { runNotificationCron, runRetentionCron } from "@/lib/cron/jobs";
import { writePlatformAuditLog } from "@/lib/audit/security";
import { safeServerActionError } from "@/lib/errors/server-error-log";
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

function readReturnTo(formData: FormData) {
  const value = readString(formData, "returnTo");
  return value.startsWith(JOBS_PATH) ? value : JOBS_PATH;
}

function redirectWithMessage(returnTo: string, message: string, type: "success" | "error" = "success") {
  const [path, query = ""] = returnTo.split("?");
  const params = new URLSearchParams(query);
  params.set("message", message);
  params.set("messageType", type);
  redirect(`${path}?${params.toString()}`);
}

function errorMessage(error: unknown) {
  return safeServerActionError(
    "platformJobsAction",
    error,
    "The action could not be completed.",
  );
}

export async function retryFailedNotificationAction(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });
  const returnTo = readReturnTo(formData);
  const notificationId = readString(formData, "notificationId");

  if (!notificationId) {
    redirectWithMessage(returnTo, "Notification id is required.", "error");
  }

  try {
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
    redirectWithMessage(returnTo, `${result.count} notification requeued.`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirectWithMessage(returnTo, errorMessage(error), "error");
  }
}

export async function retryAllFailedNotificationsAction(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });
  const returnTo = readReturnTo(formData);

  try {
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
    redirectWithMessage(returnTo, `${result.count} failed notifications requeued.`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirectWithMessage(returnTo, errorMessage(error), "error");
  }
}

export async function runNotificationsJobAction(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });
  const returnTo = readReturnTo(formData);

  try {
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
    redirectWithMessage(returnTo, "Notifications job completed.");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirectWithMessage(returnTo, errorMessage(error), "error");
  }
}

export async function runRetentionJobAction(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });
  const returnTo = readReturnTo(formData);

  try {
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
    redirectWithMessage(returnTo, "Retention job completed.");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirectWithMessage(returnTo, errorMessage(error), "error");
  }
}

export async function queueKraRetryAction(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });
  const returnTo = readReturnTo(formData);
  const attemptId = readString(formData, "attemptId");

  if (!attemptId) {
    redirectWithMessage(returnTo, "KRA attempt id is required.", "error");
  }

  try {
    const attempt = await prisma.kraSubmissionAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        outcome: true,
        errorMessage: true,
        rentalReturnId: true,
        rentalReturn: {
          select: {
            filingKey: true,
            status: true,
          },
        },
      },
    });

    if (!attempt || attempt.outcome !== "RETRYABLE") {
      throw new Error("That KRA attempt is no longer retryable.");
    }

    await prisma.$transaction([
      prisma.kraSubmissionAttempt.update({
        where: { id: attempt.id },
        data: { outcome: "FAILED" },
      }),
      prisma.rentalIncomeReturn.update({
        where: { id: attempt.rentalReturnId },
        data: {
          status: "READY",
          lastError: null,
        },
      }),
    ]);

    await writePlatformAuditLog({
      actorUserId: session.userId,
      action: "KRA_RETURN_RETRY_QUEUED",
      entityType: "RentalIncomeReturn",
      entityId: attempt.rentalReturnId,
      metadata: {
        attemptId: attempt.id,
        filingKey: attempt.rentalReturn.filingKey,
        previousStatus: attempt.rentalReturn.status,
        previousError: attempt.errorMessage,
      },
    });

    refreshJobsPage();
    redirectWithMessage(returnTo, "KRA return moved back to the ready queue.");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirectWithMessage(returnTo, errorMessage(error), "error");
  }
}
