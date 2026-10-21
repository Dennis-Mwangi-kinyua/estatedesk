import { NotificationViewButton } from "@/components/notifications/notification-view-button";
import { readNotificationActionUrl, resolveNotificationActionUrl } from "@/lib/push/notification-links";
import { Bell, CreditCard, Droplets, FileArchive, Wrench } from "lucide-react";
import {
  cn,
  formatDateTime,
  formatEnumLabel,
} from "@/app/(app)/dashboard/org/notifications/_lib/helpers";
import type {
  NotificationFilter,
  NotificationItem,
  OrgContext,
} from "@/app/(app)/dashboard/org/notifications/_lib/types";
import {
  EmptyState,
  NotificationFilterLink,
  panelShellClassName,
} from "@/app/(app)/dashboard/org/notifications/_components/notifications-ui";

type CommunicationFeedPanelProps = {
  membership: OrgContext;
  notifications: NotificationItem[];
  activeFilter: NotificationFilter;
  totalNotifications: number;
  filteredCount: number;
  unreadCount: number;
};

function getNotificationIcon(notification: NotificationItem) {
  if (notification.type.startsWith("PAYMENT_")) return CreditCard;
  if (notification.type === "WATER_BILL_ISSUED") return Droplets;
  if (notification.type.startsWith("ISSUE_")) return Wrench;
  if (`${notification.title} ${notification.message}`.toLowerCase().includes("export")) return FileArchive;
  return Bell;
}

function deliveryLabel(status: string) {
  if (status === "SENT") return "Delivered";
  if (status === "FAILED") return "Delivery failed";
  return "Queued";
}

export function CommunicationFeedPanel({
  membership,
  notifications,
  activeFilter,
  totalNotifications,
  filteredCount,
  unreadCount,
}: CommunicationFeedPanelProps) {
  return (
    <section aria-label="Notification inbox" className={panelShellClassName}>
      <div className="border-b border-border px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Inbox</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {unreadCount === 0 ? "You’re all caught up." : `${unreadCount} unread ${unreadCount === 1 ? "notification" : "notifications"}`}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">{totalNotifications} total</p>
        </div>

        <nav aria-label="Filter notifications" className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <NotificationFilterLink filter="all" activeFilter={activeFilter} label="All" />
          <NotificationFilterLink filter="unread" activeFilter={activeFilter} label="Unread" />
          <NotificationFilterLink filter="payments" activeFilter={activeFilter} label="Payments" />
          <NotificationFilterLink filter="issues" activeFilter={activeFilter} label="Issues" />
          <NotificationFilterLink filter="moveouts" activeFilter={activeFilter} label="Move-outs" />
          <NotificationFilterLink filter="water" activeFilter={activeFilter} label="Water" />
          <NotificationFilterLink filter="exports" activeFilter={activeFilter} label="Data exports" />
        </nav>
      </div>

      <div role="list" className="divide-y divide-border">
        {notifications.length === 0 ? (
          <div className="p-4 sm:p-6">
            <EmptyState
              title={activeFilter === "all" ? "No notifications yet" : "No matching notifications"}
              message={activeFilter === "all" ? "Updates addressed to you will appear here." : "Try another filter or check back later."}
            />
          </div>
        ) : notifications.map((notification) => {
          const Icon = getNotificationIcon(notification);
          const isUnread = !notification.readAt;
          const statusTone = notification.status === "FAILED"
            ? "border-destructive/20 bg-destructive/5 text-destructive"
            : notification.status === "QUEUED"
              ? "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-300"
              : "border-emerald-600/15 bg-emerald-600/5 text-emerald-700 dark:text-emerald-300";

          return (
            <article
              role="listitem"
              key={notification.id}
              className={cn("flex gap-3 px-4 py-4 transition-colors sm:gap-4 sm:px-6", isUnread && "bg-primary/[0.025]")}
            >
              <span className={cn(
                "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border",
                isUnread ? "border-primary/20 bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground",
              )}>
                <Icon aria-hidden="true" className="size-4" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h3 className="min-w-0 break-words text-sm font-semibold text-foreground">{notification.title}</h3>
                  {isUnread ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">New</span> : null}
                </div>
                <p className="mt-1.5 line-clamp-2 break-words text-sm leading-6 text-muted-foreground">{notification.message}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <time dateTime={notification.createdAt.toISOString()}>{formatDateTime(notification.createdAt, membership.org.timezone)}</time>
                  <span aria-hidden="true">·</span>
                  <span>{formatEnumLabel(notification.type)}</span>
                  <span aria-hidden="true">·</span>
                  <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", statusTone)}>{deliveryLabel(notification.status)}</span>
                </div>
              </div>

              <div className="shrink-0 self-center">
                <NotificationViewButton
                  notificationId={notification.id}
                  href={resolveNotificationActionUrl({ type: notification.type, title: notification.title, audience: "org_staff", actionUrl: readNotificationActionUrl(notification.providerResponse) })}
                  title={notification.title}
                  message={notification.message}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition hover:bg-muted/40"
                >
                  View
                </NotificationViewButton>
              </div>
            </article>
          );
        })}
      </div>

      {filteredCount > notifications.length ? (
        <p className="border-t border-border px-4 py-3 text-center text-xs text-muted-foreground sm:px-6">
          Showing the latest {notifications.length} of {filteredCount} matching notifications.
        </p>
      ) : null}
    </section>
  );
}
