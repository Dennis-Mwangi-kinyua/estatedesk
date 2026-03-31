import Link from "next/link";
import { Prisma, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 20;

const dateTimeFormatter = new Intl.DateTimeFormat("en-KE", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";
  return dateTimeFormatter.format(value);
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "—";
  return value.replaceAll("_", " ");
}

function getPageNumber(value?: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function getPageSize(value?: string) {
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

function parsePlatformRole(value?: string): PlatformRole | null {
  if (!value) return null;

  const normalized = value.trim().toUpperCase();
  return PLATFORM_ROLE_VALUES.find((role) => role === normalized) ?? null;
}

function buildAuditLogWhere(params: {
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

async function getAuditLogs(params: {
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

  const [logs, totalCount, distinctActions] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: auditLogSelect,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      select: { action: true },
      distinct: ["action"],
      orderBy: { action: "asc" },
    }),
  ]);

  return {
    logs,
    totalCount,
    actions: distinctActions.map((item) => item.action).filter(Boolean),
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

export default async function PlatformAuditLogsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolved = await searchParams;

  const page = getPageNumber(resolved.page);
  const pageSize = getPageSize(resolved.pageSize);
  const q = resolved.q?.trim() || "";
  const action = resolved.action?.trim() || "";

  const { logs, totalCount, totalPages, actions } = await getAuditLogs({
    page,
    pageSize,
    q,
    action,
  });

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Audit Logs
        </h1>
        <p className="text-sm text-muted-foreground">
          Review recent platform and organization audit activity.
        </p>
      </header>

      <FiltersCard
        q={q}
        action={action}
        actions={actions}
        pageSize={pageSize}
      />

      <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">
        <div className="flex flex-col gap-1 border-b px-4 py-4 sm:px-5">
          <h2 className="text-base font-semibold text-foreground">Recent Logs</h2>
          <p className="text-sm text-muted-foreground">
            {totalCount} total {totalCount === 1 ? "entry" : "entries"}
          </p>
        </div>

        {logs.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <MobileLogList logs={logs} />
            <DesktopTable logs={logs} />
          </>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          q={q}
          action={action}
          pageSize={pageSize}
        />
      </section>
    </div>
  );
}

function FiltersCard({
  q,
  action,
  actions,
  pageSize,
}: {
  q: string;
  action: string;
  actions: string[];
  pageSize: number;
}) {
  return (
    <section className="rounded-2xl border bg-background p-4 shadow-sm">
      <form className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <label
            htmlFor="q"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Search
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Actor, org, action, request ID, entity, IP..."
            className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/40"
          />
        </div>

        <div>
          <label
            htmlFor="action"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Action
          </label>
          <select
            id="action"
            name="action"
            defaultValue={action}
            className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/40"
          >
            <option value="">All actions</option>
            {actions.map((item) => (
              <option key={item} value={item}>
                {formatLabel(item)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="pageSize"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Per page
          </label>
          <select
            id="pageSize"
            name="pageSize"
            defaultValue={String(pageSize)}
            className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/40"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>

        <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
          >
            Apply filters
          </button>

          <Link
            href="/platform/audit-logs"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            Reset
          </Link>
        </div>
      </form>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[220px] items-center justify-center px-4 py-10 text-center text-sm text-muted-foreground">
      No audit logs found for the selected filters.
    </div>
  );
}

function MobileLogList({ logs }: { logs: AuditLogItem[] }) {
  return (
    <div className="divide-y md:hidden">
      {logs.map((log) => {
        const actorName = log.actor?.fullName?.trim() || "System";
        const actorEmail = log.actor?.email || "—";
        const orgName = log.org?.name || "—";

        return (
          <article key={log.id} className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {formatDateTime(log.createdAt)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Request: {log.requestId ?? "—"}
                </p>
              </div>
              <ActionBadge action={log.action} />
            </div>

            <div className="grid gap-3">
              <InfoBlock
                label="Actor"
                value={
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{actorName}</p>
                    <p className="text-xs text-muted-foreground">{actorEmail}</p>
                    {log.actor?.platformRole ? (
                      <MiniBadge>{formatLabel(log.actor.platformRole)}</MiniBadge>
                    ) : null}
                  </div>
                }
              />

              <InfoBlock
                label="Organization"
                value={
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{orgName}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.org?.slug ? `/${log.org.slug}` : "—"}
                    </p>
                  </div>
                }
              />

              <InfoBlock
                label="Entity"
                value={
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">
                      {formatLabel(log.entityType)}
                    </p>
                    <p className="break-all font-mono text-xs text-muted-foreground">
                      {log.entityId ?? "—"}
                    </p>
                  </div>
                }
              />

              <div className="grid grid-cols-2 gap-3">
                <InfoBlock
                  label="IP"
                  value={
                    <span className="font-mono text-xs text-muted-foreground">
                      {log.ip ?? "—"}
                    </span>
                  }
                />
                <InfoBlock
                  label="Request ID"
                  value={
                    <span className="break-all font-mono text-xs text-muted-foreground">
                      {log.requestId ?? "—"}
                    </span>
                  }
                />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function DesktopTable({ logs }: { logs: AuditLogItem[] }) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/40">
          <tr className="text-left">
            <TableHead>Time</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Request</TableHead>
            <TableHead>IP</TableHead>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const actorName = log.actor?.fullName?.trim() || "System";
            const actorEmail = log.actor?.email || "—";
            const orgName = log.org?.name || "—";

            return (
              <tr key={log.id} className="border-t align-top">
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDateTime(log.createdAt)}
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">{actorName}</div>
                    <div className="text-xs text-muted-foreground">
                      {actorEmail}
                    </div>
                    {log.actor?.platformRole ? (
                      <MiniBadge>{formatLabel(log.actor.platformRole)}</MiniBadge>
                    ) : null}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">{orgName}</div>
                    <div className="text-xs text-muted-foreground">
                      {log.org?.slug ? `/${log.org.slug}` : "—"}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <ActionBadge action={log.action} />
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">
                      {formatLabel(log.entityType)}
                    </div>
                    <div className="break-all text-xs text-muted-foreground">
                      {log.entityId ?? "—"}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="font-mono text-xs text-muted-foreground">
                  <span className="break-all">{log.requestId ?? "—"}</span>
                </TableCell>

                <TableCell className="font-mono text-xs text-muted-foreground">
                  {log.ip ?? "—"}
                </TableCell>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  q,
  action,
  pageSize,
}: {
  page: number;
  totalPages: number;
  q: string;
  action: string;
  pageSize: number;
}) {
  const previousHref = buildHref({
    page: page - 1,
    q,
    action,
    pageSize,
  });

  const nextHref = buildHref({
    page: page + 1,
    q,
    action,
    pageSize,
  });

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>

      <div className="flex gap-2">
        <Link
          aria-disabled={page <= 1}
          href={page <= 1 ? "#" : previousHref}
          className={`inline-flex min-h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium ${
            page <= 1
              ? "pointer-events-none opacity-50"
              : "transition hover:bg-muted"
          }`}
        >
          Previous
        </Link>

        <Link
          aria-disabled={page >= totalPages}
          href={page >= totalPages ? "#" : nextHref}
          className={`inline-flex min-h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium ${
            page >= totalPages
              ? "pointer-events-none opacity-50"
              : "transition hover:bg-muted"
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}

function buildHref({
  page,
  q,
  action,
  pageSize,
}: {
  page: number;
  q?: string;
  action?: string;
  pageSize?: number;
}) {
  const params = new URLSearchParams();

  params.set("page", String(page));

  if (q) params.set("q", q);
  if (action) params.set("action", action);
  if (pageSize) params.set("pageSize", String(pageSize));

  return `/platform/audit-logs?${params.toString()}`;
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium text-foreground">{children}</th>;
}

function TableCell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

function ActionBadge({ action }: { action: string }) {
  const normalized = action.toUpperCase();

  let styles = "border-border bg-muted text-foreground";

  if (
    normalized.includes("CREATE") ||
    normalized.includes("ADD") ||
    normalized.includes("GRANT") ||
    normalized.includes("APPROVE")
  ) {
    styles = "border-green-200 bg-green-50 text-green-700";
  } else if (
    normalized.includes("DELETE") ||
    normalized.includes("REMOVE") ||
    normalized.includes("REVOKE") ||
    normalized.includes("SUSPEND")
  ) {
    styles = "border-red-200 bg-red-50 text-red-700";
  } else if (
    normalized.includes("UPDATE") ||
    normalized.includes("EDIT") ||
    normalized.includes("CHANGE")
  ) {
    styles = "border-blue-200 bg-blue-50 text-blue-700";
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${styles}`}
    >
      {formatLabel(action)}
    </span>
  );
}

function MiniBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex w-fit rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {children}
    </span>
  );
}