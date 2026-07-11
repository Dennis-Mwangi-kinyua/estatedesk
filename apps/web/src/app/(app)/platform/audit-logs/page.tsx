import { isTransientDatabaseError } from "@/lib/db/retry";
import { getAuditLogs, getPageNumber, getPageSize } from "./_lib/helpers";
import type { AuditLogsSearchParams } from "./_lib/types";
import { AuditLogsWorkspace } from "./_components/audit-logs-workspace";

export const dynamic = "force-dynamic";

export default async function PlatformAuditLogsPage({
  searchParams,
}: {
  searchParams: AuditLogsSearchParams;
}) {
  const resolved = await searchParams;

  const page = getPageNumber(resolved.page);
  const pageSize = getPageSize(resolved.pageSize);
  const q = resolved.q?.trim() || "";
  const action = resolved.action?.trim() || "";

  try {
    const { logs, totalCount, actions } = await getAuditLogs({
      page,
      pageSize,
      q,
      action,
    });

    return (
      <AuditLogsWorkspace
        q={q}
        action={action}
        pageSize={pageSize}
        page={page}
        logs={logs}
        totalCount={totalCount}
        actions={actions}
      />
    );
  } catch (error) {
    console.error("[PlatformAuditLogsPage] failed to load audit logs", error);

    return (
      <div className="ed-mobile-first mx-auto w-full max-w-5xl space-y-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">
            Audit
          </p>
          <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Audit logs
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Platform operator activity, support sessions, and control-plane changes.
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50">
          <p className="font-semibold">Could not load audit logs right now</p>
          <p className="mt-1">
            {isTransientDatabaseError(error)
              ? "The database request timed out or failed temporarily (common on Neon cold starts). Refresh the page in a moment."
              : "The database request failed. Refresh the page, and if it keeps happening check connectivity and Prisma schema health."}
          </p>
        </div>
      </div>
    );
  }
}
