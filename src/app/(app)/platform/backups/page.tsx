import { prisma } from "@/lib/prisma";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { requirePlatformRole } from "@/lib/permissions/guards";
import {
  Badge,
  EmptyRow,
  PageHeader,
  StatCard,
  Surface,
  formatDateTime,
  formatNumber,
} from "../_components/control-plane";

export const dynamic = "force-dynamic";

type BackupCheckpoint = {
  name: string;
  status: "Ready" | "Review";
  cadence: string;
  latest: Date | null;
  detail: string;
};

function platformBackupQuery<T>(label: string, operation: () => Promise<T>) {
  return retryTransientDatabaseOperation(operation, {
    attempts: 3,
    delayMs: 500,
    label,
  });
}

function formatBytes(value: number) {
  if (value <= 0) return "0 MB";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex <= 1 ? 0 : 1)} ${units[unitIndex]}`;
}

function checkpointTone(status: BackupCheckpoint["status"]) {
  if (status === "Ready") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-300/10 dark:text-emerald-100";
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-100";
}

export default async function PlatformBackupsPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    organizations,
    users,
    assets,
    auditLogs,
    latestAudit,
    exportRequests,
    approvedExports,
    pendingExports,
  ] = await Promise.all([
    platformBackupQuery("backups-count-organizations", () =>
      prisma.organization.count({ where: { deletedAt: null } }),
    ),
    platformBackupQuery("backups-count-users", () =>
      prisma.user.count({ where: { deletedAt: null } }),
    ),
    platformBackupQuery("backups-asset-storage", () =>
      prisma.asset.aggregate({
        _count: true,
        _sum: { size: true },
        where: { deletedAt: null },
      }),
    ),
    platformBackupQuery("backups-audit-count", () =>
      prisma.auditLog.count({ where: { createdAt: { gte: weekAgo } } }),
    ),
    platformBackupQuery("backups-latest-audit", () =>
      prisma.auditLog.findFirst({
        orderBy: { createdAt: "desc" },
        select: {
          createdAt: true,
          action: true,
          actor: { select: { fullName: true, email: true } },
          org: { select: { name: true } },
        },
      }),
    ),
    platformBackupQuery("backups-export-requests", () =>
      prisma.dataExportRequest.findMany({
        orderBy: { requestedAt: "desc" },
        take: 8,
        include: {
          org: { select: { name: true, slug: true } },
          requestedBy: { select: { fullName: true, email: true } },
        },
      }),
    ),
    platformBackupQuery("backups-approved-exports", () =>
      prisma.dataExportRequest.count({
        where: { status: "APPROVED", reviewedAt: { gte: weekAgo } },
      }),
    ),
    platformBackupQuery("backups-pending-exports", () =>
      prisma.dataExportRequest.count({ where: { status: "PENDING" } }),
    ),
  ]);

  const assetBytes = Number(assets._sum.size ?? 0);
  const checkpoints: BackupCheckpoint[] = [
    {
      name: "Primary database",
      status: latestAudit ? "Ready" : "Review",
      cadence: "Provider PITR",
      latest: latestAudit?.createdAt ?? null,
      detail: latestAudit
        ? `Latest write activity: ${latestAudit.action}`
        : "No audit activity has been recorded yet.",
    },
    {
      name: "Organization exports",
      status: approvedExports > 0 || pendingExports === 0 ? "Ready" : "Review",
      cadence: "On demand",
      latest: exportRequests[0]?.requestedAt ?? null,
      detail:
        pendingExports > 0
          ? `${pendingExports} export request${pendingExports === 1 ? "" : "s"} awaiting review.`
          : "No export approvals are waiting.",
    },
    {
      name: "Asset inventory",
      status: assetBytes > 0 ? "Ready" : "Review",
      cadence: "Object storage",
      latest: null,
      detail: `${formatNumber(assets._count)} active file${assets._count === 1 ? "" : "s"} tracked by EstateDesk.`,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Backups"
        title="Backup and recovery"
        description="Platform-level backup readiness, recovery checkpoints, export activity, and storage footprint for the EstateDesk control plane."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Organizations covered" value={formatNumber(organizations)} />
        <StatCard label="Users covered" value={formatNumber(users)} />
        <StatCard label="Asset storage" value={formatBytes(assetBytes)} note={`${formatNumber(assets._count)} files`} />
        <StatCard label="Audit events in 7d" value={formatNumber(auditLogs)} />
        <StatCard label="Approved exports in 7d" value={formatNumber(approvedExports)} />
        <StatCard label="Pending exports" value={formatNumber(pendingExports)} />
        <StatCard
          label="Latest checkpoint"
          value={latestAudit ? formatDateTime(latestAudit.createdAt) : "-"}
          note={latestAudit?.org?.name ?? "Platform scope"}
        />
      </section>

      <Surface
        title="Recovery checkpoints"
        description="Operational checkpoints used to confirm the platform can be restored, exported, and audited."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-medium">Checkpoint</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Cadence</th>
                <th className="px-4 py-3 font-medium">Latest signal</th>
                <th className="px-4 py-3 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {checkpoints.map((checkpoint) => (
                <tr key={checkpoint.name} className="border-t border-neutral-100 align-top dark:border-white/10">
                  <td className="px-4 py-3 font-medium text-slate-950 dark:text-white">
                    {checkpoint.name}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={checkpointTone(checkpoint.status)}>
                      {checkpoint.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {checkpoint.cadence}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatDateTime(checkpoint.latest)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {checkpoint.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>

      <Surface
        title="Recent export recovery requests"
        description="Approved exports are recovery artifacts for individual organizations and can be downloaded from Data Management."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Requested by</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Requested</th>
                <th className="px-4 py-3 font-medium">Expires</th>
              </tr>
            </thead>
            <tbody>
              {exportRequests.map((request) => (
                <tr key={request.id} className="border-t border-neutral-100 dark:border-white/10">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-950 dark:text-white">
                      {request.org.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      /{request.org.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {request.requestedBy.fullName}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {request.requestedBy.email ?? "No email"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge>{request.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatDateTime(request.requestedAt)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatDateTime(request.expiresAt)}
                  </td>
                </tr>
              ))}
              {exportRequests.length === 0 ? (
                <EmptyRow colSpan={5} label="No export recovery requests found." />
              ) : null}
            </tbody>
          </table>
        </div>
      </Surface>

      <Surface title="Recovery policy">
        <div className="grid gap-0 divide-y divide-slate-100 dark:divide-white/10 md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              Database
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Point-in-time recovery is expected at the managed PostgreSQL provider layer.
            </p>
          </div>
          <div className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              Files
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              File recovery depends on object storage retention and the active asset inventory.
            </p>
          </div>
          <div className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              Exports
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Organization CSV ZIP exports remain the platform-level recovery artifact.
            </p>
          </div>
        </div>
      </Surface>
    </div>
  );
}
