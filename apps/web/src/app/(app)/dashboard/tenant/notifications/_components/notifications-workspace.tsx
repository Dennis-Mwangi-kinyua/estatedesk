import Link from "next/link";
import { Bell, CheckCircle2, Inbox, Send } from "lucide-react";
import { PageShell, SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import {
  markAllTenantNotificationsReadAction,
  markTenantNotificationReadAction,
} from "../actions";
import {
  formatDateTime,
  formatEnumLabel,
  getStatusMeta,
} from "../_lib/helpers";
import type { TenantNotificationsPageData } from "../_lib/types";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function FilterLink({
  filter,
  activeFilter,
  label,
}: {
  filter: TenantNotificationsPageData["activeFilter"];
  activeFilter: TenantNotificationsPageData["activeFilter"];
  label: string;
}) {
  const active = filter === activeFilter;

  return (
    <Link
      href={`/dashboard/tenant/notifications?filter=${filter}`}
      className={cn(
        "inline-flex h-10 shrink-0 items-center justify-center rounded-full border px-4 text-sm font-medium transition",
        active
          ? "border-neutral-950 bg-neutral-950 text-white"
          : "border-border bg-card text-foreground/80 hover:bg-muted/30",
      )}
    >
      {label}
    </Link>
  );
}

export function NotificationsWorkspace({
  data,
}: {
  data: TenantNotificationsPageData;
}) {
  const { tenant, notifications, unreadCount, activeFilter } = data;

  return (
    <PageShell>
      <SurfaceCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-medium text-foreground/80">
              <Bell className="h-3.5 w-3.5" />
              {tenant.fullName}
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
              Notifications
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Updates from payments, water billing, move-outs, inspections,
              and issue tickets.
            </p>
          </div>

          <form action={markAllTenantNotificationsReadAction}>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Mark all read
            </button>
          </form>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Loaded
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {notifications.length}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Unread
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {unreadCount}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Filter
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {formatEnumLabel(activeFilter)}
            </p>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard className="p-4 sm:p-6">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <FilterLink filter="all" activeFilter={activeFilter} label="All" />
          <FilterLink filter="unread" activeFilter={activeFilter} label="Unread" />
          <FilterLink filter="payments" activeFilter={activeFilter} label="Payments" />
          <FilterLink filter="issues" activeFilter={activeFilter} label="Issues" />
          <FilterLink filter="moveouts" activeFilter={activeFilter} label="Move-outs" />
          <FilterLink filter="water" activeFilter={activeFilter} label="Water" />
        </div>

        <div className="mt-5 space-y-3">
          {notifications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-muted/20 p-8 text-center">
              <Inbox className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">
                No notifications found
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                New updates will appear here as workflows move.
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const meta = getStatusMeta(notification.status);
              const StatusIcon = notification.readAt ? CheckCircle2 : Send;

              return (
                <article
                  key={notification.id}
                  className="rounded-3xl border border-border bg-muted/20 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border",
                        notification.readAt
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : meta.tone,
                      )}
                    >
                      <StatusIcon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {notification.title}
                        </p>
                        {!notification.readAt ? (
                          <span className="rounded-full bg-neutral-950 px-2 py-0.5 text-[10px] font-medium text-white">
                            New
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {notification.message}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatEnumLabel(notification.type)}</span>
                        <span>•</span>
                        <span>{formatEnumLabel(notification.channel)}</span>
                        <span>•</span>
                        <span>{formatDateTime(notification.createdAt)}</span>
                      </div>

                      {!notification.readAt ? (
                        <form
                          action={markTenantNotificationReadAction}
                          className="mt-3"
                        >
                          <input
                            type="hidden"
                            name="notificationId"
                            value={notification.id}
                          />
                          <button
                            type="submit"
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground/80 transition hover:bg-muted/30"
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
      </SurfaceCard>
    </PageShell>
  );
}