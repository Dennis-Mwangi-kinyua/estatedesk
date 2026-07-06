import Link from "next/link";
import { Bell, CheckCircle2, Clock3, Inbox, Send } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTenantAccess } from "@/lib/permissions/guards";
import {
  markAllTenantNotificationsReadAction,
  markTenantNotificationReadAction,
} from "./actions";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    filter?: string;
  }>;
};

type TenantNotificationFilter = "all" | "unread" | "payments" | "issues" | "moveouts" | "water";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function normalizeFilter(value?: string): TenantNotificationFilter {
  const allowed: TenantNotificationFilter[] = [
    "all",
    "unread",
    "payments",
    "issues",
    "moveouts",
    "water",
  ];

  return allowed.includes(value as TenantNotificationFilter)
    ? (value as TenantNotificationFilter)
    : "all";
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusMeta(status: string) {
  switch (status) {
    case "SENT":
      return {
        icon: Send,
        tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "FAILED":
      return {
        icon: Clock3,
        tone: "border-red-200 bg-red-50 text-red-700",
      };
    default:
      return {
        icon: Clock3,
        tone: "border-amber-200 bg-amber-50 text-amber-700",
      };
  }
}

function getNotificationWhereForFilter(
  filter: TenantNotificationFilter,
  tenant: { id: string; orgId: string; userId: string },
): Prisma.NotificationWhereInput {
  const base = {
    orgId: tenant.orgId,
    OR: [{ tenantId: tenant.id }, { userId: tenant.userId }],
  };

  if (filter === "unread") return { ...base, readAt: null };
  if (filter === "payments") {
    return {
      ...base,
      type: { in: ["PAYMENT_RECEIVED", "PAYMENT_VERIFIED"] as const },
    };
  }
  if (filter === "issues") {
    return {
      ...base,
      OR: [
        { tenantId: tenant.id },
        { userId: tenant.userId },
      ],
      AND: [
        {
          OR: [
            { type: { in: ["ISSUE_CREATED", "ISSUE_RESOLVED"] as const } },
            { title: { contains: "issue", mode: "insensitive" as const } },
            { message: { contains: "issue", mode: "insensitive" as const } },
          ],
        },
      ],
    };
  }
  if (filter === "moveouts") {
    return {
      ...base,
      AND: [
        {
          OR: [
            { title: { contains: "move-out", mode: "insensitive" as const } },
            { message: { contains: "move-out", mode: "insensitive" as const } },
          ],
        },
      ],
    };
  }
  if (filter === "water") {
    return {
      ...base,
      AND: [
        {
          OR: [
            { type: "WATER_BILL_ISSUED" },
            { title: { contains: "water", mode: "insensitive" as const } },
            { message: { contains: "water", mode: "insensitive" as const } },
          ],
        },
      ],
    };
  }

  return base;
}

function FilterLink({
  filter,
  activeFilter,
  label,
}: {
  filter: TenantNotificationFilter;
  activeFilter: TenantNotificationFilter;
  label: string;
}) {
  const active = filter === activeFilter;

  return (
    <Link
      href={`/tenants/notifications?filter=${filter}`}
      className={cn(
        "inline-flex h-10 shrink-0 items-center justify-center rounded-full border px-4 text-sm font-medium transition",
        active
          ? "border-neutral-950 bg-neutral-950 text-white"
          : "border-black/10 bg-white text-foreground/80 hover:bg-neutral-50",
      )}
    >
      {label}
    </Link>
  );
}

export default async function TenantNotificationsPage({
  searchParams,
}: PageProps) {
  const session = await requireTenantAccess();

  if (!session.userId || !session.activeOrgId) {
    throw new Error("Missing tenant session context.");
  }

  const tenant = await prisma.tenant.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId,
      deletedAt: null,
    },
    select: {
      id: true,
      orgId: true,
      fullName: true,
    },
  });

  if (!tenant) {
    return (
      <div className="ed-theme-page min-h-screen bg-background text-foreground p-4">
        <div className="rounded-[28px] ed-theme-card border border-border bg-card p-8 text-center text-sm text-neutral-600">
          Tenant profile not found.
        </div>
      </div>
    );
  }

  const activeFilter = normalizeFilter((await searchParams)?.filter);
  const tenantContext = { id: tenant.id, orgId: tenant.orgId, userId: session.userId };

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: getNotificationWhereForFilter(activeFilter, tenantContext),
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        channel: true,
        status: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({
      where: {
        orgId: tenant.orgId,
        readAt: null,
        OR: [{ tenantId: tenant.id }, { userId: session.userId }],
      },
    }),
  ]);

  return (
    <div className="ed-theme-page min-h-screen bg-background text-foreground px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <section className="rounded-[32px] ed-theme-card border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-foreground/80">
                <Bell className="h-3.5 w-3.5" />
                {tenant.fullName}
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
                Notifications
              </h1>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
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
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                Loaded
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {notifications.length}
              </p>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                Unread
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {unreadCount}
              </p>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                Filter
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatEnumLabel(activeFilter)}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] ed-theme-card border border-border bg-card p-4 shadow-sm sm:p-6">
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
              <div className="rounded-3xl border border-dashed border-black/10 bg-neutral-50 p-8 text-center">
                <Inbox className="mx-auto h-6 w-6 text-neutral-400" />
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
                const StatusIcon = notification.readAt ? CheckCircle2 : meta.icon;

                return (
                  <article
                    key={notification.id}
                    className="rounded-3xl ed-theme-muted-panel border border-border p-4"
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

                        <p className="mt-1 text-sm leading-6 text-neutral-600">
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
                              className="inline-flex h-9 items-center justify-center rounded-xl border border-black/10 bg-white px-3 text-xs font-medium text-foreground/80 transition hover:bg-neutral-50"
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
        </section>
      </div>
    </div>
  );
}
