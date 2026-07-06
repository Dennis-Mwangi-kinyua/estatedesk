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
}