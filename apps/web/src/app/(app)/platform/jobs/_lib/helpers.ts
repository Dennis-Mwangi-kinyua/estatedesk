import { CronJobStatus, NotificationChannel, NotificationType, Prisma } from "@prisma/client";
import { DEFAULT_PAGE_SIZE } from "./types";

export function formatAge(value: Date | null | undefined) {
  if (!value) return "-";

  const minutes = Math.max(0, Math.floor((Date.now() - value.getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ${minutes % 60}m`;

  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

export function readProviderError(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "-";
  const error = value.error;
  return typeof error === "string" && error.trim() ? error : "-";
}

export function getPageNumber(value?: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

export function getPageSize(value?: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.floor(parsed), 100);
}

export function formatJson(value: Prisma.JsonValue | null | undefined) {
  if (value == null) return "-";
  return JSON.stringify(value, null, 2);
}

export function buildReturnTo(params: URLSearchParams) {
  const query = params.toString();
  return query ? `/platform/jobs?${query}` : "/platform/jobs";
}

export function pagerHref(params: URLSearchParams, pageKey: string, page: number) {
  const next = new URLSearchParams(params.toString());
  next.set(pageKey, String(Math.max(1, page)));
  return `/platform/jobs?${next.toString()}`;
}

export function buildNotificationWhere(
  status: "QUEUED" | "FAILED",
  q: string,
): Prisma.NotificationWhereInput {
  const where: Prisma.NotificationWhereInput = { status };
  if (!q) return where;
  const normalized = q.trim().toUpperCase().replaceAll(" ", "_");
  const matchedType = Object.values(NotificationType).find((value) => value === normalized);
  const matchedChannel = Object.values(NotificationChannel).find((value) => value === normalized);
  const or: Prisma.NotificationWhereInput[] = [
    { title: { contains: q, mode: "insensitive" } },
    { org: { name: { contains: q, mode: "insensitive" } } },
    { tenant: { fullName: { contains: q, mode: "insensitive" } } },
    { user: { fullName: { contains: q, mode: "insensitive" } } },
  ];

  if (matchedType) or.push({ type: matchedType });
  if (matchedChannel) or.push({ channel: matchedChannel });

  where.OR = or;
  return where;
}

export function buildKraWhere(q: string): Prisma.KraSubmissionAttemptWhereInput {
  const where: Prisma.KraSubmissionAttemptWhereInput = { outcome: "RETRYABLE" };
  if (!q) return where;

  where.rentalReturn = {
    OR: [
      { period: { contains: q, mode: "insensitive" } },
      { filingKey: { contains: q, mode: "insensitive" } },
      { taxpayerPin: { contains: q, mode: "insensitive" } },
      { org: { name: { contains: q, mode: "insensitive" } } },
      { property: { name: { contains: q, mode: "insensitive" } } },
    ],
  };
  return where;
}

export function buildRunWhere(q: string, status: string): Prisma.CronJobRunWhereInput {
  const where: Prisma.CronJobRunWhereInput = {};
  const matchedStatus = Object.values(CronJobStatus).find((value) => value === status);
  if (matchedStatus) where.status = matchedStatus;
  if (!q) return where;

  where.OR = [
    { jobName: { contains: q, mode: "insensitive" } },
    { endpoint: { contains: q, mode: "insensitive" } },
    { triggerSource: { contains: q, mode: "insensitive" } },
    { error: { contains: q, mode: "insensitive" } },
    { actor: { fullName: { contains: q, mode: "insensitive" } } },
  ];
  return where;
}

export function buildJobsQueryParams(input: {
  q: string;
  jobStatus: string;
  pageSize: number;
  queuedPage: number;
  failedPage: number;
  kraPage: number;
  runsPage: number;
}) {
  const queryParams = new URLSearchParams();

  if (input.q) queryParams.set("q", input.q);
  if (input.jobStatus) queryParams.set("jobStatus", input.jobStatus);
  if (input.pageSize !== DEFAULT_PAGE_SIZE) {
    queryParams.set("pageSize", String(input.pageSize));
  }
  if (input.queuedPage > 1) queryParams.set("queuedPage", String(input.queuedPage));
  if (input.failedPage > 1) queryParams.set("failedPage", String(input.failedPage));
  if (input.kraPage > 1) queryParams.set("kraPage", String(input.kraPage));
  if (input.runsPage > 1) queryParams.set("runsPage", String(input.runsPage));

  return queryParams;
}