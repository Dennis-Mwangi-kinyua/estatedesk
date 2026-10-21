import type {
  NotificationFilter,
  PageData,
} from "@/app/(app)/dashboard/org/notifications/_lib/types";
import { DashboardAutoRefresh } from "@/features/dashboard/components/dashboard-auto-refresh";
import { CommunicationFeedPanel } from "@/app/(app)/dashboard/org/notifications/_components/communication-feed-panel";
import { Bell } from "lucide-react";
import { NotificationReadButton } from "@/components/notifications/notification-read-button";

type NotificationsWorkspaceProps = {
  activeFilter: NotificationFilter;
  data: PageData;
};

export function NotificationsWorkspace({
  activeFilter,
  data,
}: NotificationsWorkspaceProps) {
  const {
    membership,
    notifications,
    metrics: { totalNotifications, unreadCount, filteredCount },
  } = data;

  return (
    <div className="org-theme-content notifications-page uniform-page-actions mx-auto w-full min-w-0 max-w-6xl space-y-6 px-0 pb-24 pt-2 sm:px-2">
      <DashboardAutoRefresh interval={60_000} />
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{membership.org.name}</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary"><Bell aria-hidden="true" className="size-5" /></span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Notifications</h1>
              <p className="mt-1 text-sm text-muted-foreground">Your organisation updates and messages, in one place.</p>
            </div>
          </div>
        </div>
        {unreadCount > 0 ? (
          <NotificationReadButton all className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted/30 sm:w-auto">
            Mark all as read
          </NotificationReadButton>
        ) : null}
      </header>

      <CommunicationFeedPanel
        membership={membership}
        notifications={notifications}
        activeFilter={activeFilter}
        totalNotifications={totalNotifications}
        filteredCount={filteredCount}
        unreadCount={unreadCount}
      />
    </div>
  );
}
