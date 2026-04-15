import { formatDate, getStatusTone } from "@/lib/tenant/tenant-format";

type NotificationItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: Date;
};

type IssueItem = {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: Date;
};

type TenantDashboardUpdatesProps = {
  notifications: NotificationItem[];
  issues: IssueItem[];
};

export function TenantDashboardUpdates({
  notifications,
  issues,
}: TenantDashboardUpdatesProps) {
  return (
    <div className="rounded-[30px] border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">Updates</p>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
            Notices & requests
          </h2>
        </div>
        <span className="rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-medium text-pink-700">
          🔔 Recent
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {notifications.slice(0, 2).map((notice) => (
          <div key={notice.id} className="rounded-[24px] bg-neutral-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-neutral-950">{notice.title}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  {notice.type} • {formatDate(notice.createdAt)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusTone(
                  notice.status
                )}`}
              >
                {notice.status}
              </span>
            </div>
          </div>
        ))}

        {issues.slice(0, 3).map((issue) => (
          <div key={issue.id} className="rounded-[24px] bg-neutral-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-neutral-950">{issue.title}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  {issue.priority} • {formatDate(issue.createdAt)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusTone(
                  issue.status
                )}`}
              >
                {issue.status}
              </span>
            </div>
          </div>
        ))}

        {notifications.length === 0 && issues.length === 0 ? (
          <div className="rounded-[24px] bg-neutral-50 p-4 text-sm text-neutral-500">
            No notices or issues yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}