import "server-only";

import { buildRetentionReport } from "@/lib/data-retention/report";
import { queueDuePaymentNotifications } from "@/lib/ledger";
import { dispatchQueuedNotifications } from "@/lib/notifications/dispatch";
import { sendSecurityAlert } from "@/lib/security/alerts";
import { runScheduledOwnerStatementDelivery } from "@/lib/accounting/owner-statement-delivery";
import { processLeaseSigningLifecycle } from "@/lib/leases/signing";
import { prisma } from "@/lib/prisma";
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
      const leaseSigning = await processLeaseSigningLifecycle();
      const dispatch = await dispatchQueuedNotifications();

      return {
        remindersQueued: reminders.queued,
        leaseSigning,
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

export async function runOwnerStatementCron(input?: {
  triggerSource?: "cron" | "manual";
  actorUserId?: string;
}) {
  return recordCronJobRun({
    jobName: "owner-statements",
    endpoint: "/api/cron/owner-statements",
    triggerSource: input?.triggerSource ?? "cron",
    actorUserId: input?.actorUserId,
    run: async () => runScheduledOwnerStatementDelivery(prisma),
    toCounts: (result) => ({
      processedCount: result.orgsProcessed + result.skipped,
      successCount: result.emailsSent,
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
