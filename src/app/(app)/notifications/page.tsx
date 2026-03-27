import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

export default async function NotificationsPage() {
  const notifications = await prisma.notification.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      org: {
        select: {
          id: true,
          name: true,
        },
      },
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          status: true,
        },
      },
      tenant: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          status: true,
        },
      },
    },
  });

  const totalNotifications = notifications.length;
  const queuedCount = notifications.filter((n) => n.status === "QUEUED").length;
  const sentCount = notifications.filter((n) => n.status === "SENT").length;
  const failedCount = notifications.filter((n) => n.status === "FAILED").length;

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Notifications</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Track in-app, SMS, and email notifications across the platform.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Back to Dashboard
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Notifications</p>
          <p className="mt-2 text-2xl font-semibold">{totalNotifications}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Queued</p>
          <p className="mt-2 text-2xl font-semibold">{queuedCount}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Sent</p>
          <p className="mt-2 text-2xl font-semibold">{sentCount}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Failed</p>
          <p className="mt-2 text-2xl font-semibold">{failedCount}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">All Notifications</h2>
        </div>

        {notifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No notifications found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Message</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Channel</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Sent At</th>
                  <th className="px-4 py-3 font-medium">Read At</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notification) => (
                  <tr key={notification.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{notification.title}</td>
                    <td className="px-4 py-3 max-w-md">{notification.message}</td>
                    <td className="px-4 py-3">{notification.type}</td>
                    <td className="px-4 py-3">{notification.channel}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full border px-2.5 py-1 text-xs">
                        {notification.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {notification.user?.fullName ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {notification.tenant?.fullName ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {formatDateTime(notification.sentAt)}
                    </td>
                    <td className="px-4 py-3">
                      {formatDateTime(notification.readAt)}
                    </td>
                    <td className="px-4 py-3">
                      {formatDateTime(notification.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}