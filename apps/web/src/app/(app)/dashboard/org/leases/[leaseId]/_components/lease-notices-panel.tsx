import { EmojiSticker as VisualSticker } from "@/components/shared/emoji-sticker";
import { formatDate } from "../_lib/helpers";
import type { LeaseDetailsData } from "../_lib/types";

export function LeaseNoticesPanel({ lease }: { lease: LeaseDetailsData["lease"] }) {
  return (
    <section className="grid min-w-0 gap-4 xl:grid-cols-2">
      <div className="overflow-hidden workspace-panel min-w-0 rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="flex items-center gap-3 text-base font-semibold"><VisualSticker label="Move-Out Notices" size="xs" />Move-Out Notices</h2>
        </div>

        {lease.moveOutNotices.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No move-out notices found.
          </div>
        ) : (
          <div className="divide-y">
            {lease.moveOutNotices.map((notice) => (
              <div key={notice.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="min-w-0 break-words text-right font-medium">{notice.id}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Notice: {formatDate(notice.noticeDate)} • Move-out:{" "}
                      {formatDate(notice.moveOutDate)}
                    </p>
                  </div>

                  <span className="inline-flex shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs">
                    {notice.status}
                  </span>
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                  {notice.notes ?? "No additional notes."}
                </p>

                {notice.inspection ? (
                  <div className="mt-3 rounded-lg border bg-muted/20 p-3 text-sm">
                    <p className="min-w-0 break-words text-right font-medium">Inspection</p>
                    <p className="mt-1 text-muted-foreground">
                      Scheduled: {formatDate(notice.inspection.scheduledAt)}
                    </p>
                    <p className="shrink-0 text-muted-foreground">
                      Status: {notice.inspection.status}
                    </p>
                    <p className="shrink-0 text-muted-foreground">
                      Inspector: {notice.inspection.inspector.fullName}
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-hidden workspace-panel min-w-0 rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="flex items-center gap-3 text-base font-semibold"><VisualSticker label="Recent Tenant Action Logs" size="xs" />Recent Tenant Action Logs</h2>
        </div>

        {lease.tenantActionLogs.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No recent tenant action logs found.
          </div>
        ) : (
          <div className="divide-y">
            {lease.tenantActionLogs.map((log) => (
              <div key={log.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="min-w-0 break-words text-right font-medium">{log.action}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      By {log.actor.fullName} on {formatDate(log.createdAt)}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                  {log.reason ?? log.notes ?? "No extra details."}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}