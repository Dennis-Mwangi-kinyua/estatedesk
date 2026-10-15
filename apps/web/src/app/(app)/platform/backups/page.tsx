import Link from "@/components/navigation/workspace-link";
import { prisma } from "@/lib/prisma";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { getPlatformControl } from "@/lib/platform/control";
import {
  Activity,
  ArchiveRestore,
  Building2,
  CheckCircle2,
  Clock3,
  Cloud,
  Database,
  FileCheck2,
  HardDrive,
  RotateCcw,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  Badge,
  EmptyRow,
  PageHeader,
  Surface,
  formatDateTime,
  formatNumber,
} from "../_components/control-plane";
import {
  markRestoreDrillAction,
  recordBackupCheckpointAction,
} from "./actions";

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

function BackupMetric({ label, value, note, icon: Icon }: {
  label: string;
  value: string | number;
  note?: string;
  icon: LucideIcon;
}) {
  return (
    <article className="min-w-0 rounded-2xl border border-border bg-card/90 p-4 shadow-sm">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="whitespace-normal text-xs font-semibold leading-5 text-muted-foreground">{label}</p>
          <p className="mt-1 whitespace-normal text-xl font-semibold leading-tight tracking-tight text-foreground [overflow-wrap:break-word]">{value}</p>
          {note ? <p className="mt-1 whitespace-normal text-xs leading-5 text-muted-foreground [overflow-wrap:break-word]">{note}</p> : null}
        </div>
      </div>
    </article>
  );
}

function checkpointIcon(name: string) {
  if (name === "Primary database") return Database;
  if (name === "Organization exports") return ArchiveRestore;
  return HardDrive;
}

export default async function PlatformBackupsPage({
  searchParams,
}: {
  searchParams?: Promise<{ ok?: string; error?: string }>;
}) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const params = searchParams ? await searchParams : {};
  const control = await getPlatformControl();

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
    latestRestore,
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
    platformBackupQuery("backups-latest-restore", () =>
      prisma.auditLog.findFirst({
        where: { action: "PLATFORM_RESTORE_DRILL_RECORDED" },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true, metadata: true },
      }),
    ),
  ]);

  const restoreMetadata = latestRestore?.metadata;
  const restoreNote = restoreMetadata && typeof restoreMetadata === "object" && !Array.isArray(restoreMetadata) && typeof restoreMetadata.note === "string"
    ? restoreMetadata.note
    : null;
  const assetBytes = Number(assets._sum.size ?? 0);
  const checkpoints: BackupCheckpoint[] = [
    {
      name: "Primary database",
      status: control.lastBackupStatus === "Ready" ? "Ready" : "Review",
      cadence: "Operator checkpoint",
      latest: control.lastBackupStatus === "Restore drill OK" ? null : control.lastBackupAt,
      detail: control.lastBackupStatus === "Ready"
        ? "An operator recorded a successful backup. Confirm provider retention and archive availability separately."
        : "Backup verification is needed. Recent application activity does not prove a recoverable backup exists.",
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
    <div className="engineering-workspace mx-auto min-w-0 w-full max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Developer portal"
        title="Backup and recovery"
        description="Review recovery records, export activity, and operator-reported backup evidence. Record completed checks here after verifying your backup provider or recovery tools."
        action={<Link href="/platform/data-management" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold">Manage data exports</Link>}
      />

      {params.error ? <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-500/10 dark:text-amber-100">Select a valid checkpoint status and provide an evidence note of 10–2,000 characters.</p> : null}
      {params.ok === "checkpoint" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Backup checkpoint recorded.
        </div>
      ) : null}
      {params.ok === "restore-drill" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Restore drill recorded.
        </div>
      ) : null}

      <section className="engineering-metrics grid gap-4">
        <BackupMetric icon={Building2} label="Organizations covered" value={formatNumber(organizations)} />
        <BackupMetric icon={Users} label="Users covered" value={formatNumber(users)} />
        <BackupMetric icon={HardDrive} label="Asset storage" value={formatBytes(assetBytes)} note={`${formatNumber(assets._count)} files`} />
        <BackupMetric icon={Activity} label="Audit events in 7d" value={formatNumber(auditLogs)} />
        <BackupMetric icon={FileCheck2} label="Approved exports in 7d" value={formatNumber(approvedExports)} />
        <BackupMetric icon={Clock3} label="Pending exports" value={formatNumber(pendingExports)} />
        <BackupMetric icon={ShieldCheck}
          label="Operator checkpoint"
          value={control.lastBackupStatus === "Restore drill OK" ? "Not recorded" : control.lastBackupStatus ?? "Not recorded"}
          note={
            control.lastBackupStatus !== "Restore drill OK" && control.lastBackupAt
              ? formatDateTime(control.lastBackupAt)
              : "Provider backup evidence required"
          }
        />
        <BackupMetric icon={CheckCircle2}
          label="Latest restore drill"
          value={latestRestore ? "Recorded" : "Not recorded"}
          note={latestRestore ? formatDateTime(latestRestore.createdAt) : "Run a disposable recovery drill, then record the result"}
        />
      </section>

      <div className="engineering-panels grid gap-5">
        <Surface
          title="Record backup checkpoint"
          description="After running scripts/backup-database.sh or provider PITR snapshot, record status for the control plane."
        >
          <form action={recordBackupCheckpointAction} className="space-y-3 p-5">
            <label htmlFor="backup-status" className="block text-sm font-medium">Checkpoint status</label>
            <select id="backup-status"
              name="status"
              defaultValue="Review"
              className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
            >
              <option value="Ready">Ready</option>
              <option value="Review">Review</option>
              <option value="Failed">Failed</option>
            </select>
            <label htmlFor="backup-note" className="block text-sm font-medium">Backup evidence</label>
            <textarea id="backup-note"
              name="note" required minLength={10} maxLength={2000}
              rows={4}
              placeholder="Archive or snapshot identifier, validation result, and storage location. Do not include secrets."
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
            />
            <button data-workspace-action="true" className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
              Record checkpoint
            </button>
          </form>
        </Surface>

        <Surface
          title="Record restore drill"
          description="After scripts/restore-drill.sh, log completion for compliance evidence."
        >
          <form action={markRestoreDrillAction} className="space-y-3 p-5">
            <p className="text-sm leading-6 text-muted-foreground">Latest recorded drill: {latestRestore ? formatDateTime(latestRestore.createdAt) : "None recorded"}. This records evidence; it does not run a restore.</p>
            <label htmlFor="restore-note" className="block text-sm font-medium">Restore drill evidence</label>
            <textarea id="restore-note"
              name="note" required minLength={10} maxLength={2000}
              rows={4}
              placeholder="Disposable target, archive identifier, validation result, and evidence ticket. Do not include secrets."
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
            />
            <button data-workspace-action="true" className="h-11 w-full rounded-xl border border-border bg-card text-sm font-semibold">
              Mark restore drill complete
            </button>
          </form>
        </Surface>
      </div>

      <Surface
        title="Recovery checkpoints"
        description="Operational checkpoints used to confirm the platform can be restored, exported, and audited."
      >
        <div className="engineering-record-grid engineering-card-view">
          {checkpoints.map((checkpoint) => {
            const Icon = checkpointIcon(checkpoint.name);
            return (
              <article key={checkpoint.name} className="space-y-2.5 px-3 py-3.5 sm:px-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="flex min-w-0 items-center gap-2 break-words text-sm font-semibold leading-5 text-foreground">
                  <Icon aria-hidden="true" className="size-4 shrink-0 text-primary" />
                  <span>{checkpoint.name}</span>
                </h3>
                <Badge tone={checkpointTone(checkpoint.status)}>
                  {checkpoint.status}
                </Badge>
              </div>
              <dl className="grid gap-1.5 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground">Cadence</dt>
                  <dd className="min-w-0 break-words text-right font-medium text-foreground">
                    {checkpoint.cadence}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground">Latest signal</dt>
                  <dd className="min-w-0 break-words text-right font-medium text-foreground">
                    {formatDateTime(checkpoint.latest)}
                  </dd>
                </div>
              </dl>
              <p className="break-words text-sm leading-6 text-muted-foreground">
                {checkpoint.detail}
              </p>
              </article>
            );
          })}
        </div>

        <div className="engineering-table-view hidden max-w-full overflow-x-auto">
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
        <div className="engineering-record-grid engineering-card-view">
          {exportRequests.map((request) => (
            <article key={request.id} className="space-y-2.5 px-3 py-3.5 sm:px-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-sm font-semibold leading-5 text-foreground">
                    {request.org.name}
                  </h3>
                  <p className="mt-0.5 break-all text-xs text-muted-foreground">
                    /{request.org.slug}
                  </p>
                </div>
                <Badge>{request.status}</Badge>
              </div>
              <p className="break-words text-xs text-muted-foreground">
                Requested by {request.requestedBy.fullName}
              </p>
              <dl className="grid gap-1.5 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground">Requested</dt>
                  <dd className="min-w-0 break-words text-right font-medium text-foreground">
                    {formatDateTime(request.requestedAt)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground">Expires</dt>
                  <dd className="min-w-0 break-words text-right font-medium text-foreground">
                    {formatDateTime(request.expiresAt)}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
          {exportRequests.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No export recovery requests found.
            </p>
          ) : null}
        </div>

        <div className="engineering-table-view hidden max-w-full overflow-x-auto">
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

      <Surface title="Recorded backup evidence" description="Operator-submitted evidence is separate from automated provider verification.">
        <div className="engineering-summary-grid grid gap-4 p-5">
          <div className="rounded-xl border border-border p-4"><h3 className="text-sm font-semibold">Backup checkpoint</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{control.lastBackupNote ?? "No backup evidence note has been recorded."}</p></div>
          <div className="rounded-xl border border-border p-4"><h3 className="text-sm font-semibold">Restore drill</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{restoreNote ?? "No restore drill evidence note has been recorded."}</p></div>
        </div>
        <p className="border-t border-border p-5 text-sm leading-6 text-muted-foreground">Latest application activity: {latestAudit ? formatDateTime(latestAudit.createdAt) : "Not recorded"}. Application activity is not backup evidence.</p>
      </Surface>

      <Surface title="Recovery policy">
        <div className="engineering-record-grid">
          <div className="p-4">
            <Database aria-hidden="true" className="mb-3 size-5 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              Database
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Point-in-time recovery is expected at the managed PostgreSQL provider layer.
            </p>
          </div>
          <div className="p-4">
            <Cloud aria-hidden="true" className="mb-3 size-5 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              Files
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              File recovery depends on object storage retention and the active asset inventory.
            </p>
          </div>
          <div className="p-4">
            <RotateCcw aria-hidden="true" className="mb-3 size-5 text-primary" />
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
