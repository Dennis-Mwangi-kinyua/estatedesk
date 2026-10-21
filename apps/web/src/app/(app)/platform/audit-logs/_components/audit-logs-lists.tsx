import { auditDetailValue, auditPage } from "@/lib/audit/log-detail";
import { formatAuditGeo, formatDateTime, formatLabel } from "../_lib/helpers";
import type { AuditLogItem } from "./audit-logs-types";
import { ActionBadge } from "./audit-logs-shared";

function AuditLogDetails({ log }: { log: AuditLogItem }) {
  const page = auditPage(log);
  const fields = [["Log ID", log.id], ["Page / route", page ?? "Not captured for this log"], ["Timestamp (UTC)", log.createdAt.toISOString()],
    ["Actor", log.actor?.fullName ?? "System"], ["Actor email", log.actor?.email ?? "—"], ["Actor ID", log.actor?.id ?? "—"],
    ["Platform role", log.actor?.platformRole ?? "—"], ["Organization", log.org?.name ?? "Platform"], ["Organization ID", log.org?.id ?? "—"],
    ["Action", log.action], ["Entity type", log.entityType], ["Entity ID", log.entityId], ["Request ID", log.requestId ?? "Not captured"],
    ["IP address", log.ip ?? "Not captured"], ["Location", formatAuditGeo(log.metadata)], ["Device / user agent", log.userAgent ?? "Not captured"]];
  return <div className="space-y-5 border-t border-border p-4 sm:p-5"><dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{fields.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm font-medium [overflow-wrap:anywhere]">{value}</dd></div>)}</dl>
    <div className="grid min-w-0 gap-4 xl:grid-cols-3">{[["Metadata", log.metadata], ["Before", log.beforeState], ["After", log.afterState]].map(([label, value]) => <section key={String(label)} className="min-w-0"><h3 className="mb-2 text-sm font-semibold">{String(label)}</h3><pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl border bg-muted/30 p-3 text-xs [overflow-wrap:anywhere]">{JSON.stringify(auditDetailValue(value), null, 2) ?? "Not captured"}</pre></section>)}</div>
    <div className="flex flex-wrap items-center gap-3"><a href={`/platform/audit-logs/${encodeURIComponent(log.id)}/download`} className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Download full log (JSON)</a><p className="text-xs text-muted-foreground">Includes captured context and before/after values. Credentials and signature payloads are redacted.</p></div>
  </div>;
}
function ExpandableAuditLogs({ logs, className }: { logs: AuditLogItem[]; className: string }) {
  return <div className={className}>{logs.map(log => <details key={log.id} className="group border-b border-border last:border-0"><summary className="flex cursor-pointer list-none flex-wrap items-start gap-3 p-4 transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:p-5"><span className="mt-1 text-primary group-open:rotate-90" aria-hidden="true">▶</span><div className="min-w-0 flex-1 space-y-2"><div className="flex flex-wrap items-center gap-2"><ActionBadge action={log.action} /><span className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</span></div><p className="break-words text-sm font-semibold">{log.actor?.fullName || "System"} · {log.org?.name || "Platform"}</p><p className="break-all text-xs text-muted-foreground">{auditPage(log) ?? "Page not captured"} · {formatLabel(log.entityType)} / {log.entityId}</p></div><span className="text-xs font-semibold text-primary group-open:hidden">Expand details</span><span className="hidden text-xs font-semibold text-primary group-open:inline">Collapse</span></summary><AuditLogDetails log={log} /></details>)}</div>;
}
export function MobileLogList({ logs }: { logs: AuditLogItem[] }) { return <ExpandableAuditLogs logs={logs} className="md:hidden" />; }
export function DesktopTable({ logs }: { logs: AuditLogItem[] }) { return <ExpandableAuditLogs logs={logs} className="hidden md:block" />; }
