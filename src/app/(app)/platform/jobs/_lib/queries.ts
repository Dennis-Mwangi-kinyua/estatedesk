import { prisma } from "@/lib/prisma";
import {
  buildKraWhere,
  buildNotificationWhere,
  buildRunWhere,
} from "./helpers";
import type { JobsPageInput } from "./types";

export async function getJobsPageData(input: JobsPageInput) {
  const now = new Date();
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const queuedWhere = buildNotificationWhere("QUEUED", input.q);
  const failedWhere = buildNotificationWhere("FAILED", input.q);
  const kraWhere = buildKraWhere(input.q);
  const runWhere = buildRunWhere(input.q, input.jobStatus);
  const queuedSkip = (input.queuedPage - 1) * input.pageSize;
  const failedSkip = (input.failedPage - 1) * input.pageSize;
  const kraSkip = (input.kraPage - 1) * input.pageSize;
  const runsSkip = (input.runsPage - 1) * input.pageSize;

  const [
    queued,
    failed,
    latestSent,
    oldestQueued,
    oldestFailed,
    queuedOver15m,
    queuedOver1h,
    queuedTotal,
    queuedNotifications,
    failedTotal,
    failedNotifications,
    retryableKra,
    retryableKraTotal,
    retryableKraAttempts,
    jobRunsTotal,
    jobRuns,
  ] = await Promise.all([
    prisma.notification.count({ where: { status: "QUEUED" } }),
    prisma.notification.count({ where: { status: "FAILED" } }),
    prisma.notification.findFirst({
      where: { status: "SENT" },
      orderBy: { sentAt: "desc" },
      select: { sentAt: true },
    }),
    prisma.notification.findFirst({
      where: { status: "QUEUED" },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    prisma.notification.findFirst({
      where: { status: "FAILED" },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    prisma.notification.count({
      where: { status: "QUEUED", createdAt: { lte: fifteenMinutesAgo } },
    }),
    prisma.notification.count({
      where: { status: "QUEUED", createdAt: { lte: hourAgo } },
    }),
    prisma.notification.count({ where: queuedWhere }),
    prisma.notification.findMany({
      where: queuedWhere,
      orderBy: { createdAt: "asc" },
      skip: queuedSkip,
      take: input.pageSize,
      select: {
        id: true,
        type: true,
        channel: true,
        title: true,
        status: true,
        createdAt: true,
        org: { select: { name: true } },
        tenant: { select: { fullName: true } },
        user: { select: { fullName: true } },
      },
    }),
    prisma.notification.count({ where: failedWhere }),
    prisma.notification.findMany({
      where: failedWhere,
      orderBy: { createdAt: "desc" },
      skip: failedSkip,
      take: input.pageSize,
      select: {
        id: true,
        type: true,
        channel: true,
        title: true,
        status: true,
        createdAt: true,
        providerResponse: true,
        org: { select: { name: true } },
        tenant: { select: { fullName: true } },
        user: { select: { fullName: true } },
      },
    }),
    prisma.kraSubmissionAttempt.count({ where: { outcome: "RETRYABLE" } }),
    prisma.kraSubmissionAttempt.count({ where: kraWhere }),
    prisma.kraSubmissionAttempt.findMany({
      where: kraWhere,
      orderBy: { attemptedAt: "desc" },
      skip: kraSkip,
      take: input.pageSize,
      select: {
        id: true,
        channel: true,
        httpStatus: true,
        errorMessage: true,
        attemptedAt: true,
        rentalReturn: {
          select: {
            period: true,
            filingKey: true,
            status: true,
            org: { select: { name: true, slug: true } },
            property: { select: { name: true } },
          },
        },
      },
    }),
    prisma.cronJobRun.count({ where: runWhere }),
    prisma.cronJobRun.findMany({
      where: runWhere,
      orderBy: { startedAt: "desc" },
      skip: runsSkip,
      take: input.pageSize,
      select: {
        id: true,
        jobName: true,
        endpoint: true,
        triggerSource: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        durationMs: true,
        processedCount: true,
        successCount: true,
        failedCount: true,
        error: true,
        metadata: true,
        actor: { select: { fullName: true } },
      },
    }),
  ]);

  return {
    queued,
    failed,
    latestSent,
    oldestQueued,
    oldestFailed,
    queuedOver15m,
    queuedOver1h,
    queuedTotal,
    queuedNotifications,
    failedTotal,
    failedNotifications,
    retryableKra,
    retryableKraTotal,
    retryableKraAttempts,
    jobRunsTotal,
    jobRuns,
  };
}

export type JobsPageData = Awaited<ReturnType<typeof getJobsPageData>>;