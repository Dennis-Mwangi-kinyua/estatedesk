import {
  PageHeader,
  PaginationControls,
  Surface,
} from "../../_components/control-plane";
import {
  DesktopTable,
  EmptyState,
  FiltersCard,
  MobileLogList,
} from "./audit-logs-ui";
import type { getAuditLogs } from "../_lib/helpers";

export type AuditLogsWorkspaceProps = {
  q: string;
  action: string;
  pageSize: number;
  page: number;
  logs: Awaited<ReturnType<typeof getAuditLogs>>["logs"];
  totalCount: number;
  actions: string[];
};

export function AuditLogsWorkspace(props: AuditLogsWorkspaceProps) {
  const { q, action, pageSize, page, logs, totalCount, actions } = props;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Activity trail"
        title="Audit Logs"
        description="Review recent platform and organization audit activity."
      />

      <FiltersCard
        q={q}
        action={action}
        actions={actions}
        pageSize={pageSize}
      />

      <Surface
        title="Recent Logs"
        description={`${totalCount} total ${totalCount === 1 ? "entry" : "entries"}`}
      >
        {logs.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <MobileLogList logs={logs} />
            <DesktopTable logs={logs} />
          </>
        )}

        <PaginationControls
          page={page}
          pageSize={pageSize}
          total={totalCount}
          basePath="/platform/audit-logs"
          query={{ q, action }}
        />
      </Surface>
    </div>
  );
}