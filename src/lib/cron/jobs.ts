import "server-only";

import { buildRetentionReport } from "@/lib/data-retention/report";
import { queueDuePaymentNotifications } from "@/lib/ledger";
import { dispatchQueuedNotifications } from "@/lib/notifications/dispatch";
import { sendSecurityAlert } from "@/lib/security/alerts";
import { recordCronJobRun } from "./job-runs";

export async function runNotificationCron(input?: {
  triggerSource?: "cron" | "manual";
  actorUserId?: string;
}) {
  return recordCronJobRun({
    jobName: "notifications",
    endpoint: "/api/cron/notifications",
    triggerSource: input?.triggerSource ?? "cron",
    actorUserId: input?.actorUserId,
    run: async () => {
      const reminders = await queueDuePaymentNotifications();
      const dispatch = await dispatchQueuedNotifications();

      return {
        remindersQueued: reminders.queued,
        ...dispatch,
      };
    },
    toCounts: (result) => ({
      processedCount: result.processed,
      successCount: result.sent,
      failedCount: result.failed,
    }),
  });
}

export async function runRetentionCron(input?: {
  triggerSource?: "cron" | "manual";
  actorUserId?: string;
}) {
  return recordCronJobRun({
    jobName: "retention",
    endpoint: "/api/cron/retention",
    triggerSource: input?.triggerSource ?? "cron",
    actorUserId: input?.actorUserId,
    run: async () => {
      const report = await buildRetentionReport();
      const totalRecords = report.reduce((sum, org) => sum + org.total, 0);

      if (totalRecords > 0) {
        await sendSecurityAlert({
          event: "DATA_RETENTION_REVIEW_REQUIRED",
          severity: "info",
          summary: `${totalRecords} soft-deleted records are older than their organization retention policy.`,
          metadata: {
            mode: "report_only",
            organizations: report.map((org) => ({
              orgId: org.orgId,
              orgName: org.orgName,
              total: org.total,
              cutoff: org.cutoff,
            })),
          },
        });
      }

      return {
        mode: "report_only",
        totalOrganizations: report.length,
        totalRecords,
        report,
      };
    },
    toCounts: (result) => ({
      processedCount: result.totalOrganizations,
      successCount: result.totalRecords,
      failedCount: 0,
    }),
  });
}
