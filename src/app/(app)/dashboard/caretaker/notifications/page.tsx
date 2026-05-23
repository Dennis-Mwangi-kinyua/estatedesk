import { Bell, CheckCircle2, Clock3, Send } from "lucide-react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import {
  markAllCaretakerNotificationsReadAction,
  markCaretakerNotificationReadAction,
} from "./actions";

export const dynamic = "force-dynamic";

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusClasses(status: string) {
  if (status === "SENT") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "FAILED") return "border-red-200 bg-red-50 text-red-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default async function CaretakerNotificationsPage() {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    redirect("/login");
  }

  if (session.activeOrgRole !== "CARETAKER") {
    redirect("/dashboard");
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: {
        orgId: session.activeOrgId,
        userId: session.userId,
      },
      orderBy: { createdAt: "desc" },
      take: 80,
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
        orgId: session.activeOrgId,
        userId: session.userId,
        readAt: null,
      },
    }),
  ]);

  return (
    <div className="space-y-5 pb-5 sm:space-y-6">
      <section className="ios-panel rounded-[28px] p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                <Bell className="h-[18px] w-[18px]" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Caretaker
              </p>
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              Notifications
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
              Assignment, issue, inspection, payment, and operational updates
              sent to you in EstateDesk.
            </p>
          </div>

          {unreadCount > 0 ? (
            <form action={markAllCaretakerNotificationsReadAction}>
              <button
                type="submit"
                className="ios-button inline-flex items-center justify-center gap-2 border border-neutral-200 bg-white/88 px-3 py-2 text-xs font-semibold text-neutral-800 shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                Read all
              </button>
            </form>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-neutral-200">
            <p className="text-xs font-medium text-neutral-500">Unread</p>
            <p className="mt-1 text-2xl font-bold text-neutral-950">
              {unreadCount.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-neutral-200">
            <p className="text-xs font-medium text-neutral-500">Recent</p>
            <p className="mt-1 text-2xl font-bold text-neutral-950">
              {notifications.length.toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        {notifications.length === 0 ? (
          <div className="ios-card rounded-[26px] p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
              <Bell className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-semibold text-neutral-950">
              No notifications yet
            </p>
            <p className="mt-1 text-sm leading-6 text-neutral-500">
              New assignments and process updates will appear here.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <article
              key={notification.id}
              className={`ios-card rounded-[24px] p-4 ${
                notification.readAt ? "opacity-75" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                  {notification.status === "SENT" ? (
                    <Send className="h-4 w-4" />
                  ) : (
                    <Clock3 className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-950">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-neutral-600">
                        {notification.message}
                      </p>
                    </div>
                    {!notification.readAt ? (
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-neutral-950" />
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 font-medium text-neutral-600">
                      {formatEnum(notification.type)}
                    </span>
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 font-medium text-neutral-600">
                      {formatEnum(notification.channel)}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 font-medium ${statusClasses(
                        notification.status,
                      )}`}
                    >
                      {formatEnum(notification.status)}
                    </span>
                    <span className="text-neutral-500">
                      {formatDateTime(notification.createdAt)}
                    </span>
                  </div>

                  {!notification.readAt ? (
                    <form
                      action={markCaretakerNotificationReadAction}
                      className="mt-3"
                    >
                      <input
                        type="hidden"
                        name="notificationId"
                        value={notification.id}
                      />
                      <button
                        type="submit"
                        className="ios-button inline-flex items-center justify-center rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-neutral-800 ring-1 ring-neutral-200"
                      >
                        Mark as read
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
