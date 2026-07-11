import { Prisma, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";

const DEFAULT_PAGE_SIZE = 20;

const dateTimeFormatter = new Intl.DateTimeFormat("en-KE", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";
  return dateTimeFormatter.format(value);
}

export function formatLabel(value: string | null | undefined) {
  if (!value) return "—";
  return value.replaceAll("_", " ");
}

export function formatAuditGeo(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || !("geo" in metadata)) {
    return "Location unknown";
  }

  const geo = (metadata as { geo?: Record<string, unknown> }).geo;
  if (!geo) return "Location unknown";

  const parts = [geo.city, geo.region, geo.country]
    .map((value) => (typeof value === "string" ? value : null))
    .filter(Boolean);

  const provider =
    typeof geo.serviceProvider === "string" ? geo.serviceProvider : null;

  return [parts.join(", ") || "Location unknown", provider]
    .filter(Boolean)
    .join(" · ");
}

export function getPageNumber(value?: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function getPageSize(value?: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(parsed, 100);
}

type SearchParams = Promise<{
  page?: string;
  pageSize?: string;
  q?: string;
  action?: string;
}>;

const auditLogSelect = {
  id: true,
  createdAt: true,
  action: true,
  entityType: true,
  entityId: true,
  requestId: true,
  ip: true,
  userAgent: true,
  metadata: true,
  actor: {
    select: {
      id: true,
      fullName: true,
      email: true,
      platformRole: true,
    },
  },
  org: {
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
    },
  },
} satisfies Prisma.AuditLogSelect;

type AuditLogItem = Prisma.AuditLogGetPayload<{
  select: typeof auditLogSelect;
}>;

const PLATFORM_ROLE_VALUES: readonly PlatformRole[] = [
  PlatformRole.USER,
  PlatformRole.SUPER_ADMIN,
  PlatformRole.PLATFORM_ADMIN,
];

export function parsePlatformRole(value?: string): PlatformRole | null {
  if (!value) return null;

  const normalized = value.trim().toUpperCase();
  return PLATFORM_ROLE_VALUES.find((role) => role === normalized) ?? null;
}

export function buildAuditLogWhere(params: {
  q?: string;
  action?: string;
}): Prisma.AuditLogWhereInput {
  const { q, action } = params;

  const where: Prisma.AuditLogWhereInput = {};

  if (action) {
    where.action = action;
  }

  if (q) {
    const matchedRole = parsePlatformRole(q);

    const actorOr: Prisma.UserWhereInput[] = [
      { fullName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];

    if (matchedRole) {
      actorOr.push({ platformRole: matchedRole });
    }

    where.OR = [
      { action: { contains: q, mode: "insensitive" } },
      { entityType: { contains: q, mode: "insensitive" } },
      { entityId: { contains: q, mode: "insensitive" } },
      { requestId: { contains: q, mode: "insensitive" } },
      { ip: { contains: q, mode: "insensitive" } },
      {
        actor: {
          is: {
            OR: actorOr,
          },
        },
      },
      {
        org: {
          is: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
            ],
          },
        },
      },
    ];
  }

  return where;
}

function auditLogsQuery<T>(label: string, operation: () => Promise<T>) {
  return retryTransientDatabaseOperation(operation, {
    attempts: 4,
    delayMs: 650,
    label,
  });
}

export async function getAuditLogs(params: {
  page: number;
  pageSize: number;
  q?: string;
  action?: string;
}) {
  const { page, pageSize, q, action } = params;
  const skip = (page - 1) * pageSize;

  const where = buildAuditLogWhere({
    q: q?.trim() || undefined,
    action: action?.trim() || undefined,
  });

  // Neon cold starts + large audit tables often time out on first hit.
  // Retry the whole batch; keep distinct-actions lighter via groupBy.
  return auditLogsQuery("platform-audit-logs", async () => {
    const [logs, totalCount, actionGroups] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: auditLogSelect,
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ["action"],
        orderBy: { action: "asc" },
      }),
    ]);

    return {
      logs,
      totalCount,
      actions: actionGroups.map((item) => item.action).filter(Boolean),
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    };
  });
}

