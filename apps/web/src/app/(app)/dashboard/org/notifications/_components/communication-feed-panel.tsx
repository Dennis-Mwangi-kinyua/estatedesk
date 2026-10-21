import { NotificationViewButton } from "@/components/notifications/notification-view-button";
import { NotificationReadStateButton } from "@/components/notifications/notification-read-state-button";
import { readNotificationActionUrl, resolveNotificationActionUrl } from "@/lib/push/notification-links";
import { Bell, CreditCard, Droplets, FileArchive, Wrench } from "lucide-react";
import Link from "@/components/navigation/workspace-link";
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
  search: string;
  page: number;
  hasMore: boolean;
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
  search,
  page,
  hasMore,
}: CommunicationFeedPanelProps) {
  const nextParams = new URLSearchParams({ filter: activeFilter, page: String(page + 1) });
  if (search) nextParams.set("q", search);
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

        <form action="/dashboard/org/notifications" method="get" role="search" className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <input type="hidden" name="filter" value={activeFilter} />
          <label htmlFor="notification-search" className="sr-only">Search notifications</label>
          <input id="notification-search" name="q" type="search" defaultValue={search} maxLength={100} placeholder="Search titles and messages" className="min-h-12 w-full min-w-0 rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-ring focus:ring-4 focus:ring-ring/15" />
          <button className="min-h-12 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Search</button>
          {search ? <Link href={`/dashboard/org/notifications?filter=${activeFilter}`} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold">Clear</Link> : null}
        </form>

        <nav aria-label="Filter notifications" className="mt-4 flex snap-x gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">
          <NotificationFilterLink filter="all" activeFilter={activeFilter} label="All" search={search} />
          <NotificationFilterLink filter="unread" activeFilter={activeFilter} label="Unread" search={search} />
          <NotificationFilterLink filter="payments" activeFilter={activeFilter} label="Payments" search={search} />
          <NotificationFilterLink filter="issues" activeFilter={activeFilter} label="Issues" search={search} />
          <NotificationFilterLink filter="moveouts" activeFilter={activeFilter} label="Move-outs" search={search} />
          <NotificationFilterLink filter="water" activeFilter={activeFilter} label="Water" search={search} />
          <NotificationFilterLink filter="exports" activeFilter={activeFilter} label="Data exports" search={search} />
        </nav>
      </div>

      <div id="notification-list" role="list" className="divide-y divide-border">
        {notifications.length === 0 ? (
          <div className="p-4 sm:p-6">
            <EmptyState
              title={search ? "No matching notifications" : activeFilter === "all" ? "No notifications yet" : "No matching notifications"}
              message={search ? "Try different search words or clear the search." : activeFilter === "all" ? "Updates addressed to you will appear here." : "Try another filter or check back later."}
            />
          </div>
        ) : notifications.map((notification) => {
          const Icon = getNotificationIcon(notification);
          const isUnread = !notification.readAt;
          return (
            <article
              role="listitem"
              key={notification.id}
              className={cn("flex flex-col gap-3 px-4 py-4 transition-colors sm:flex-row sm:gap-4 sm:px-6", isUnread && "bg-primary/[0.025]")}
            >
              <div className="flex min-w-0 items-start gap-3 sm:flex-1 sm:gap-4">
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
                </div>
                <details className="mt-3 text-xs">
                  <summary className="min-h-11 w-fit cursor-pointer py-3 font-semibold text-muted-foreground">Delivery details</summary>
                  <div className="flex flex-wrap gap-2 pb-1">
                    {notification.deliveries.map(delivery => <span key={delivery.channel} className={cn("rounded-full border px-2.5 py-1 font-medium", delivery.status === "FAILED" ? "border-destructive/20 bg-destructive/5 text-destructive" : delivery.status === "QUEUED" ? "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-300" : "border-emerald-600/15 bg-emerald-600/5 text-emerald-700 dark:text-emerald-300")}>{formatEnumLabel(delivery.channel)} · {deliveryLabel(delivery.status)}</span>)}
                  </div>
                  {notification.deliveries.filter(delivery => delivery.status === "FAILED" && delivery.detail).map(delivery => <p key={`${delivery.channel}-detail`} className="mt-2 text-muted-foreground">{formatEnumLabel(delivery.channel)}: {delivery.detail}</p>)}
                  {notification.deliveries.some(delivery => delivery.status === "FAILED") ? <p className="mt-2 text-muted-foreground">A delivery channel reported a failure. Check the recipient details and retry from the relevant workflow if needed.</p> : null}
                  {notification.deliveries.some(delivery => delivery.status === "QUEUED") ? <p className="mt-2 text-muted-foreground">Queued messages are waiting for their delivery provider.</p> : null}
                </details>
                </div>
              </div>

              <div className="grid w-full shrink-0 grid-cols-1 gap-2 sm:w-auto sm:self-center">
                <NotificationViewButton
                  notificationId={notification.id}
                  href={resolveNotificationActionUrl({ type: notification.type, title: notification.title, audience: "org_staff", actionUrl: readNotificationActionUrl(notification.providerResponse) })}
                  title={notification.title}
                  message={notification.message}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-muted/40 sm:w-auto"
                >
                  View message &amp; actions
                </NotificationViewButton>
                <NotificationReadStateButton notificationId={notification.id} isRead={!isUnread} />
              </div>
            </article>
          );
        })}
      </div>

      <div className="border-t border-border px-4 py-4 sm:px-6">
        <p className="text-center text-xs text-muted-foreground">{filteredCount} matching notifications{search ? ` for “${search}”` : ""}</p>
        {hasMore ? <Link href={`/dashboard/org/notifications?${nextParams.toString()}#notification-list`} className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted/30">Load more</Link> : null}
      </div>
    </section>
  );
}
