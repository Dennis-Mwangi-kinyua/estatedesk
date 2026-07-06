import { Clock3, Send } from "lucide-react";
import { markCaretakerNotificationReadAction } from "../actions";
import {
  formatDateTime,
  formatEnum,
  statusClasses,
} from "../_lib/helpers";
import type { CaretakerNotificationsPageData } from "../_lib/types";

type NotificationItem = CaretakerNotificationsPageData["notifications"][number];

export function NotificationCard({
  notification,
}: {
  notification: NotificationItem;
}) {
  const isUnread = !notification.readAt;

  return (
    <article
      className={`rounded-2xl border border-border bg-card p-4 transition ${
        isUnread ? "shadow-sm" : "opacity-80"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/20 text-muted-foreground">
          {notification.status === "SENT" ? (
            <Send className="h-4 w-4" />
          ) : (
            <Clock3 className="h-4 w-4" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {notification.title}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {notification.message}
              </p>
            </div>

            {isUnread ? (
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-border bg-muted/20 px-2.5 py-1 font-medium text-muted-foreground">
              {formatEnum(notification.type)}
            </span>
            <span className="rounded-full border border-border bg-muted/20 px-2.5 py-1 font-medium text-muted-foreground">
              {formatEnum(notification.channel)}
            </span>
            <span
              className={`rounded-full border px-2.5 py-1 font-medium ${statusClasses(
                notification.status,
              )}`}
            >
              {formatEnum(notification.status)}
            </span>
            <span className="text-muted-foreground">
              {formatDateTime(notification.createdAt)}
            </span>
          </div>

          {isUnread ? (
            <form action={markCaretakerNotificationReadAction} className="mt-3">
              <input
                type="hidden"
                name="notificationId"
                value={notification.id}
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted/30"
              >
                Mark as read
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </article>
  );
}