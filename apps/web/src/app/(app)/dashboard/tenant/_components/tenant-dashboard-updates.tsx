import Link from "next/link";
import { ArrowUpRight, Bell, Wrench } from "lucide-react";
import { formatDate, getStatusTone } from "@/lib/tenant/tenant-format";
import type {
  TenantDashboardIssueItem,
  TenantDashboardNotificationItem,
} from "../_lib/types";
import { panelShellClassName } from "./tenant-dashboard-ui";

type TenantDashboardUpdatesProps = {
  notifications: TenantDashboardNotificationItem[];
  issues: TenantDashboardIssueItem[];
};

export function TenantDashboardUpdates({
  notifications,
  issues,
}: TenantDashboardUpdatesProps) {
  return (
    <section className={panelShellClassName}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Activity
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
            Notices & requests
          </h2>
        </div>
        <Link
          href="/dashboard/tenant/notifications"
          className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/20 px-3 py-1 text-xs font-medium text-foreground transition hover:bg-muted/35"
        >
          All updates
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="space-y-0 divide-y divide-border">
        {notifications.slice(0, 2).map((notice) => (
          <Link key={notice.id} href="/dashboard/tenant/notifications" className="block px-4 py-4 transition hover:bg-muted/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Bell aria-hidden="true" className="size-4" /></span>
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-foreground">{notice.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Notification • {formatDate(notice.createdAt)}
                </p>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusTone(
                  notice.status,
                )}`}
              >
                {notice.status}
              </span>
            </div>
          </Link>
        ))}

        {issues.slice(0, 3).map((issue) => (
          <Link key={issue.id} href="/dashboard/tenant/issues" className="block px-4 py-4 transition hover:bg-muted/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300"><Wrench aria-hidden="true" className="size-4" /></span>
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-foreground">{issue.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {issue.priority} priority • {formatDate(issue.createdAt)}
                </p>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusTone(
                  issue.status,
                )}`}
              >
                {issue.status}
              </span>
            </div>
          </Link>
        ))}

        {notifications.length === 0 && issues.length === 0 ? (
          <div className="px-5 py-8 text-sm text-muted-foreground sm:px-6">
            No notices or maintenance requests yet.
          </div>
        ) : null}
      </div>
    </section>
  );
}
