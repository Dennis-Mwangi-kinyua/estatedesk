import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import {
  Badge,
  PageHeader,
  StatCard,
  Surface,
  formatDateTime,
  formatNumber,
  labelize,
  toneForStatus,
} from "../_components/control-plane";

export const dynamic = "force-dynamic";

export default async function SystemHealthPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const [orgs, users, queued, failed, sentToday, failedPayments, kraErrors, latestAudit] =
    await Promise.all([
      prisma.organization.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.notification.count({ where: { status: "QUEUED" } }),
      prisma.notification.count({ where: { status: "FAILED" } }),
      prisma.notification.count({ where: { status: "SENT", sentAt: { gte: dayAgo } } }),
      prisma.payment.count({ where: { gatewayStatus: "FAILED" } }),
      prisma.kraIntegration.findMany({
        where: { OR: [{ status: "ERROR" }, { lastError: { not: null } }] },
        orderBy: { updatedAt: "desc" },
        take: 8,
        include: { org: { select: { name: true, slug: true } } },
      }),
      prisma.auditLog.findFirst({
        orderBy: { createdAt: "desc" },
        select: { createdAt: true, action: true, org: { select: { name: true } } },
      }),
    ]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Developer portal"
        title="System health"
        description="Live health indicators for the database-backed control plane, notification queue, payment failures, and KRA integration errors."
      />

      <section className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Organizations" value={formatNumber(orgs)} />
        <StatCard label="Users" value={formatNumber(users)} />
        <StatCard label="Queued notifications" value={formatNumber(queued)} />
        <StatCard label="Failed notifications" value={formatNumber(failed)} />
        <StatCard label="Sent in 24h" value={formatNumber(sentToday)} />
        <StatCard label="Failed payments" value={formatNumber(failedPayments)} />
        <StatCard label="KRA integration errors" value={formatNumber(kraErrors.length)} />
        <StatCard
          label="Latest audit"
          value={latestAudit ? labelize(latestAudit.action) : "-"}
          note={
            latestAudit
              ? `${latestAudit.org?.name ?? "Platform"} • ${formatDateTime(latestAudit.createdAt)}`
              : undefined
          }
        />
      </section>

      <Surface
        title="KRA integration alerts"
        description="Organizations with ERROR status or a recorded lastError. Newest first."
      >
        {kraErrors.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No KRA integration errors recorded.
          </p>
        ) : (
          <>
            {/* Mobile-first cards (default) */}
            <ul className="ed-kra-alerts-list divide-y divide-border lg:hidden">
              {kraErrors.map((item) => (
                <li key={item.id} className="space-y-3 px-3 py-4 sm:px-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/platform/organizations/${item.org.slug}`}
                        className="text-sm font-semibold text-foreground hover:underline"
                      >
                        {item.org.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        /{item.org.slug}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={toneForStatus(item.status)}>{item.status}</Badge>
                      <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {item.environment}
                      </span>
                    </div>
                  </div>

                  <dl className="grid gap-2 text-sm">
                    <div className="rounded-xl border border-border bg-muted/20 px-3 py-2">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Last sync
                      </dt>
                      <dd className="mt-0.5 text-foreground">
                        {formatDateTime(item.lastSyncAt)}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-red-200/80 bg-red-50/60 px-3 py-2 dark:border-red-500/25 dark:bg-red-500/10">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-red-800 dark:text-red-100">
                        Last error
                      </dt>
                      <dd className="mt-0.5 break-words text-sm leading-6 text-red-900 dark:text-red-50">
                        {item.lastError?.trim() || "—"}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <div className="ed-kra-alerts-table hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-muted/40 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Organization</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Environment</th>
                    <th className="px-4 py-3 font-medium">Last sync</th>
                    <th className="px-4 py-3 font-medium">Last error</th>
                  </tr>
                </thead>
                <tbody>
                  {kraErrors.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="whitespace-normal px-4 py-3">
                        <Link
                          href={`/platform/organizations/${item.org.slug}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {item.org.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          /{item.org.slug}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={toneForStatus(item.status)}>{item.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item.environment}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateTime(item.lastSyncAt)}
                      </td>
                      <td className="max-w-md whitespace-normal break-words px-4 py-3 text-muted-foreground">
                        {item.lastError ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Surface>
    </div>
  );
}
