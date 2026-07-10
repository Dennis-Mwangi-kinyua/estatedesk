import "server-only";

import { CronJobStatus, Prisma } from "@prisma/client";
import { safeClientMessage } from "@/lib/errors/client-safe-error";
import { logServerError } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import { sendSecurityAlert } from "@/lib/security/alerts";

type CronRunCounts = {
  processedCount?: number;
  successCount?: number;
  failedCount?: number;
};

type CronRunInput<T> = {
  jobName: string;
  endpoint?: string;
  triggerSource: "cron" | "manual";
  actorUserId?: string;
  run: () => Promise<T>;
  toCounts?: (result: T) => CronRunCounts;
  toMetadata?: (result: T) => Prisma.InputJsonValue;
};

export async function recordCronJobRun<T>({
  jobName,
  endpoint,
  triggerSource,
  actorUserId,
  run,
  toCounts,
  toMetadata,
}: CronRunInput<T>) {
  const startedAt = new Date();
  const jobRun = await prisma.cronJobRun.create({
    data: {
      jobName,
      endpoint,
      triggerSource,
      actorUserId,
      status: CronJobStatus.RUNNING,
      startedAt,
    },
    select: { id: true },
  });

  try {
    const result = await run();
    const finishedAt = new Date();
    const counts = toCounts?.(result) ?? {};

    await prisma.cronJobRun.update({
      where: { id: jobRun.id },
      data: {
        status: CronJobStatus.SUCCESS,
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        processedCount: counts.processedCount ?? 0,
        successCount: counts.successCount ?? 0,
        failedCount: counts.failedCount ?? 0,
        metadata: toMetadata?.(result) ?? (result as Prisma.InputJsonValue),
      },
    });

    return result;
  } catch (error) {
    const finishedAt = new Date();
    const clientSafeError = safeClientMessage(error, "Cron job failed.");
    logServerError(`cron.${jobName}`, error, { endpoint, triggerSource });

    await prisma.cronJobRun.update({
      where: { id: jobRun.id },
      data: {
        status: CronJobStatus.FAILED,
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        error: clientSafeError,
      },
    });

    await sendSecurityAlert({
      event: "CRON_JOB_FAILED",
      severity: "critical",
      actorUserId,
      entityType: "CronJobRun",
      entityId: jobRun.id,
      summary: `${jobName} cron job failed.`,
      metadata: {
        endpoint,
        triggerSource,
        error: clientSafeError,
      },
    });

    throw error;
  }
}
