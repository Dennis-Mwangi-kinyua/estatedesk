import { formatAuditGeo, formatDateTime, formatLabel } from "../_lib/helpers";
import type { AuditLogItem } from "./audit-logs-types";
import {
  ActionBadge,
  InfoBlock,
  MiniBadge,
  TableCell,
  TableHead,
} from "./audit-logs-shared";

export function MobileLogList({ logs }: { logs: AuditLogItem[] }) {
  return (
    <div className="divide-y divide-slate-200 dark:divide-white/10 md:hidden">
      {logs.map((log) => {
        const actorName = log.actor?.fullName?.trim() || "System";
        const actorEmail = log.actor?.email || "—";
        const orgName = log.org?.name || "—";

        return (
          <article key={log.id} className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-950 dark:text-white">
                  {formatDateTime(log.createdAt)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
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
                    <p className="font-medium text-slate-950 dark:text-white">
                      {actorName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {actorEmail}
                    </p>
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
                    <p className="font-medium text-slate-950 dark:text-white">
                      {orgName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {log.org?.slug ? `/${log.org.slug}` : "—"}
                    </p>
                  </div>
                }
              />

              <InfoBlock
                label="Entity"
                value={
                  <div className="space-y-1">
                    <p className="font-medium text-slate-950 dark:text-white">
                      {formatLabel(log.entityType)}
                    </p>
                    <p className="break-all font-mono text-xs text-slate-500 dark:text-slate-400">
                      {log.entityId ?? "—"}
                    </p>
                  </div>
                }
              />

              <div className="grid grid-cols-2 gap-3">
                <InfoBlock
                  label="IP"
                  value={
                    <div className="space-y-1">
                      <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        {log.ip ?? "—"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatAuditGeo(log.metadata)}
                      </p>
                    </div>
                  }
                />
                <InfoBlock
                  label="Request ID"
                  value={
                    <span className="break-all font-mono text-xs text-slate-500 dark:text-slate-400">
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

export function DesktopTable({ logs }: { logs: AuditLogItem[] }) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900/80">
          <tr className="text-left">
            <TableHead>Time</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Request</TableHead>
            <TableHead>IP / Location</TableHead>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const actorName = log.actor?.fullName?.trim() || "System";
            const actorEmail = log.actor?.email || "—";
            const orgName = log.org?.name || "—";

            return (
              <tr
                key={log.id}
                className="border-t border-slate-200 align-top dark:border-white/10"
              >
                <TableCell className="whitespace-nowrap text-slate-500 dark:text-slate-400">
                  {formatDateTime(log.createdAt)}
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-slate-950 dark:text-white">
                      {actorName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {actorEmail}
                    </div>
                    {log.actor?.platformRole ? (
                      <MiniBadge>{formatLabel(log.actor.platformRole)}</MiniBadge>
                    ) : null}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-slate-950 dark:text-white">
                      {orgName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {log.org?.slug ? `/${log.org.slug}` : "—"}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <ActionBadge action={log.action} />
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-slate-950 dark:text-white">
                      {formatLabel(log.entityType)}
                    </div>
                    <div className="break-all text-xs text-slate-500 dark:text-slate-400">
                      {log.entityId ?? "—"}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  <span className="break-all">{log.requestId ?? "—"}</span>
                </TableCell>

                <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                  <div className="space-y-1">
                    <p className="font-mono">{log.ip ?? "—"}</p>
                    <p>{formatAuditGeo(log.metadata)}</p>
                    <p className="max-w-[220px] truncate">
                      {log.userAgent ?? "—"}
                    </p>
                  </div>
                </TableCell>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}