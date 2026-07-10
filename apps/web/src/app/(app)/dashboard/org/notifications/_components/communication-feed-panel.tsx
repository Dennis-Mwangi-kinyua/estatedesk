import { markAllOrgNotificationsReadAction, markNotificationReadAction } from "@/app/(app)/dashboard/org/notifications/actions";
import {
  cn,
  formatDateTime,
  formatEnumLabel,
  getNotificationStatusMeta,
} from "@/app/(app)/dashboard/org/notifications/_lib/helpers";
import type {
  NotificationFilter,
  NotificationItem,
  OrgContext,
} from "@/app/(app)/dashboard/org/notifications/_lib/types";
import {
  EmptyState,
  NotificationFilterLink,
  PanelHeader,
  panelBodyClassName,
  panelItemClassName,
  panelShellClassName,
  secondaryButtonClassName,
} from "@/app/(app)/dashboard/org/notifications/_components/notifications-ui";

type CommunicationFeedPanelProps = {
  membership: OrgContext;
  notifications: NotificationItem[];
  activeFilter: NotificationFilter;
  totalNotifications: number;
  unreadCount: number;
  queuedCount: number;
  failedCount: number;
};

export function CommunicationFeedPanel({
  membership,
  notifications,
  activeFilter,
  totalNotifications,
  unreadCount,
  queuedCount,
  failedCount,
}: CommunicationFeedPanelProps) {
  return (
    <section className={panelShellClassName}>
      <div className={`border-b border-border ${panelBodyClassName}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <PanelHeader
            eyebrow="Activity log"
            title="Communication feed"
            description="Recent notifications sent to tenants, staff, and caretakers."
          />

          <form action={markAllOrgNotificationsReadAction}>
            <button type="submit" className={`${secondaryButtonClassName} sm:w-auto`}>
              Mark all read
            </button>
          </form>
        </div>

        <div className="no-scrollbar -mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1">
          <NotificationFilterLink filter="all" activeFilter={activeFilter} label="All" />
          <NotificationFilterLink filter="unread" activeFilter={activeFilter} label="Unread" />
          <NotificationFilterLink filter="payments" activeFilter={activeFilter} label="Payments" />
          <NotificationFilterLink filter="issues" activeFilter={activeFilter} label="Issues" />
          <NotificationFilterLink filter="moveouts" activeFilter={activeFilter} label="Move-outs" />
          <NotificationFilterLink filter="water" activeFilter={activeFilter} label="Water" />
        </div>
      </div>

      <div className={`space-y-3 ${panelBodyClassName}`}>
        {notifications.length === 0 ? (
          <EmptyState
            title="No notifications yet"
            message="When messages are queued or delivered, they will appear here."
            guideTopic="rent"
            orgRole={membership.role}
          />
        ) : (
          notifications.map((notification) => {
            const meta = getNotificationStatusMeta(notification.status);
            const StatusIcon = meta.icon;

            return (
              <article key={notification.id} className={panelItemClassName}>
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border",
                      meta.tone,
                    )}
                  >
                    <StatusIcon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="min-w-0 text-sm font-semibold text-foreground">
                        {notification.title}
                      </p>
                      {!notification.readAt && (
                        <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          New
                        </span>
                      )}
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          meta.tone,
                        )}
                      >
                        {formatEnumLabel(notification.status)}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {notification.message}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatEnumLabel(notification.type)}</span>
                      <span>•</span>
                      {(notification.channels?.length
                        ? notification.channels
                        : [notification.channel]
                      ).map((channel) => (
                        <span
                          key={channel}
                          className="rounded-full border border-border bg-muted/20 px-2 py-0.5 text-[10px] font-medium text-foreground"
                        >
                          {formatEnumLabel(channel)}
                        </span>
                      ))}
                      <span>•</span>
                      <span>
                        {formatDateTime(notification.createdAt, membership.org.timezone)}
                      </span>
                    </div>

                    {(notification.user || notification.tenant) && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Recipient:{" "}
                        {notification.tenant?.fullName ??
                          notification.user?.fullName ??
                          "—"}
                      </p>
                    )}

                    {!notification.readAt ? (
                      <form action={markNotificationReadAction} className="mt-3">
                        <input type="hidden" name="notificationId" value={notification.id} />
                        <button
                          type="submit"
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground transition hover:bg-muted/20"
                        >
                          Mark read
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-border p-5 sm:grid-cols-4 sm:p-6">
        {[
          { label: "Loaded", value: totalNotifications },
          { label: "Unread", value: unreadCount },
          { label: "Queued", value: queuedCount },
          { label: "Failed", value: failedCount },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-border bg-muted/10 p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-2 text-xl font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}