import { prisma } from "@/lib/prisma";
import { countOnlineUsers } from "@/lib/auth/presence";
import {
  isTransientDatabaseError,
  retryTransientDatabaseOperation,
} from "@/lib/db/retry";
import { requirePlatformRole } from "@/lib/permissions/guards";
import {
  AdminLink,
  Badge,
  EmptyRow,
  PageHeader,
  StatCard,
  Surface,
  formatDateTime,
  labelize,
  toneForStatus,
} from "../_components/control-plane";

export const dynamic = "force-dynamic";

const SECURITY_ACTION_HINTS = [
  "LOGIN",
  "LOGOUT",
  "DENIED",
  "PASSWORD",
  "ADMIN",
  "PERMISSION",
  "SESSION",
  "SUSPEND",
  "DISABLE",
] as const;

function securityQuery<T>(label: string, operation: () => Promise<T>) {
  return retryTransientDatabaseOperation(operation, {
    attempts: 4,
    delayMs: 650,
    label,
  });
}

type SecurityLog = {
  id: string;
  createdAt: Date;
  action: string;
  entityType: string;
  entityId: string;
  ip: string | null;
  actor: {
    fullName: string;
    email: string | null;
    platformRole: string | null;
  };
  org: { id: string; name: string; slug: string } | null;
};

function SecurityLogCard({ log }: { log: SecurityLog }) {
  return (
    <article className="min-w-0 border-b border-border last:border-b-0">
      <div className="space-y-2.5 px-3 py-3.5 sm:px-4 sm:py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="break-words text-sm font-semibold leading-5 text-foreground">
              {log.actor.fullName}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {log.actor.email ?? labelize(log.actor.platformRole)}
            </p>
          </div>
          <p className="shrink-0 text-[11px] text-muted-foreground sm:text-xs">
            {formatDateTime(log.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge tone={toneForStatus(log.action)}>{labelize(log.action)}</Badge>
          {log.org ? (
            <span className="inline-flex rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground">
              {log.org.name}
            </span>
          ) : (
            <span className="inline-flex rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Platform
            </span>
          )}
        </div>

        <dl className="grid grid-cols-1 gap-1.5 text-[11px] text-muted-foreground sm:grid-cols-2 sm:text-xs">
          <div className="min-w-0">
            <dt className="font-medium">Organization</dt>
            <dd className="mt-0.5 font-semibold text-foreground">
              {log.org ? (
                <AdminLink href={`/platform/organizations/${log.org.slug}`}>
                  {log.org.name}
                </AdminLink>
              ) : (
                "Platform"
              )}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="font-medium">IP</dt>
            <dd className="mt-0.5 font-semibold text-foreground">
              {log.ip ?? "—"}
            </dd>
          </div>
          <div className="min-w-0 sm:col-span-2">
            <dt className="font-medium">Entity</dt>
            <dd className="mt-0.5 break-all font-semibold text-foreground">
              {log.entityType} / {log.entityId}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

export default async function SecurityCenterPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  let activeSessions: number;
  let onlineUsers: number;
  let platformAdmins: number;
  let forcedChanges: number;
  let resetTokens: number;
  let logs: SecurityLog[];

  try {
    const loaded = await securityQuery("platform-security-center", async () => {
      const [
        activeSessionCount,
        onlineUserCount,
        platformAdminCount,
        forcedChangeCount,
        resetTokenCount,
        securityLogs,
      ] = await Promise.all([
        prisma.userSession.count({
          where: { expiresAt: { gt: new Date() } },
        }),
        countOnlineUsers(),
        prisma.user.count({
          where: {
            deletedAt: null,
            platformRole: { in: ["SUPER_ADMIN", "PLATFORM_ADMIN"] },
          },
        }),
        prisma.user.count({
          where: { deletedAt: null, mustChangePassword: true },
        }),
        prisma.passwordResetToken.count({
          where: { usedAt: null, expiresAt: { gt: new Date() } },
        }),
        prisma.auditLog.findMany({
          where: {
            OR: SECURITY_ACTION_HINTS.map((hint) => ({
              action: { contains: hint, mode: "insensitive" as const },
            })),
          },
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            actor: {
              select: { fullName: true, email: true, platformRole: true },
            },
            org: { select: { id: true, name: true, slug: true } },
          },
        }),
      ]);

      return {
        activeSessions: activeSessionCount,
        onlineUsers: onlineUserCount,
        platformAdmins: platformAdminCount,
        forcedChanges: forcedChangeCount,
        resetTokens: resetTokenCount,
        logs: securityLogs as SecurityLog[],
      };
    });

    activeSessions = loaded.activeSessions;
    onlineUsers = loaded.onlineUsers;
    platformAdmins = loaded.platformAdmins;
    forcedChanges = loaded.forcedChanges;
    resetTokens = loaded.resetTokens;
    logs = loaded.logs;
  } catch (error) {
    console.error("[SecurityCenterPage] load failed", error);

    return (
      <div className="ed-mobile-first space-y-4 sm:space-y-5">
        <PageHeader
          eyebrow="Security center"
          title="Access and risk signals"
          description="Active sessions, admin footprint, password reset exposure, and security-relevant audit events."
        />
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50">
          <p className="font-semibold">Could not load security center right now</p>
          <p className="mt-1">
            {isTransientDatabaseError(error)
              ? "The database request timed out or failed temporarily (common on Neon cold starts). Refresh the page in a moment."
              : "The database request failed. Refresh the page, and if it keeps happening check connectivity and Prisma schema health."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ed-mobile-first space-y-4 sm:space-y-5 lg:space-y-6">
      <PageHeader
        eyebrow="Security center"
        title="Access and risk signals"
        description="Active sessions, admin footprint, password reset exposure, and security-relevant audit events."
      />

      <section className="ed-keep-cols grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-5">
        <StatCard label="Online now" value={onlineUsers} />
        <StatCard label="Active sessions" value={activeSessions} />
        <StatCard label="Platform admins" value={platformAdmins} />
        <StatCard label="Must change password" value={forcedChanges} />
        <StatCard label="Reset tokens" value={resetTokens} />
      </section>

      <Surface
        title="Security audit stream"
        description={`${logs.length} recent security-related event${logs.length === 1 ? "" : "s"}`}
      >
        {logs.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No security audit events found.
          </div>
        ) : (
          <>
            <ul className="ed-access-matrix-list lg:hidden">
              {logs.map((log) => (
                <li key={log.id}>
                  <SecurityLogCard log={log} />
                </li>
              ))}
            </ul>

            <div className="ed-access-matrix-table hidden lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/40 text-left text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Time</th>
                      <th className="px-4 py-3 font-medium">Actor</th>
                      <th className="px-4 py-3 font-medium">Organization</th>
                      <th className="px-4 py-3 font-medium">Action</th>
                      <th className="px-4 py-3 font-medium">Entity</th>
                      <th className="px-4 py-3 font-medium">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-t border-border align-top"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">
                            {log.actor.fullName}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {log.actor.email ?? log.actor.platformRole}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          {log.org ? (
                            <AdminLink
                              href={`/platform/organizations/${log.org.slug}`}
                            >
                              {log.org.name}
                            </AdminLink>
                          ) : (
                            <span className="text-muted-foreground">
                              Platform
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={toneForStatus(log.action)}>
                            {labelize(log.action)}
                          </Badge>
                        </td>
                        <td className="max-w-[14rem] break-all px-4 py-3 text-muted-foreground">
                          {log.entityType} / {log.entityId}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {log.ip ?? "—"}
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 ? (
                      <EmptyRow
                        colSpan={6}
                        label="No security audit events found."
                      />
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </Surface>
    </div>
  );
}
