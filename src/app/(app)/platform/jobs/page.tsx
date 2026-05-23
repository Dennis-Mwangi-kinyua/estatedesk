import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import {
  Badge,
  EmptyRow,
  PageHeader,
  StatCard,
  Surface,
  formatDateTime,
  labelize,
  toneForStatus,
} from "../_components/control-plane";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const [queued, failed, latestSent, latestFailed, failedNotifications, retryableKra] =
    await Promise.all([
      prisma.notification.count({ where: { status: "QUEUED" } }),
      prisma.notification.count({ where: { status: "FAILED" } }),
      prisma.notification.findFirst({ where: { status: "SENT" }, orderBy: { sentAt: "desc" } }),
      prisma.notification.findFirst({ where: { status: "FAILED" }, orderBy: { createdAt: "desc" } }),
      prisma.notification.findMany({
        where: { status: "FAILED" },
        orderBy: { createdAt: "desc" },
        take: 40,
        include: { org: { select: { name: true } } },
      }),
      prisma.kraSubmissionAttempt.count({ where: { outcome: "RETRYABLE" } }),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Background jobs"
        title="Cron and queue monitor"
        description="Operational view of notification dispatch, reminder queue, and retryable KRA attempts."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Queued notifications" value={queued} />
        <StatCard label="Failed notifications" value={failed} />
        <StatCard label="Last sent" value={formatDateTime(latestSent?.sentAt)} />
        <StatCard label="Retryable KRA attempts" value={retryableKra} />
      </section>

      <Surface
        title="Job endpoints"
        description="The notification cron queues due-payment reminders before dispatching queued notifications."
      >
        <div className="grid gap-3 p-4 md:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="font-semibold text-neutral-950">POST /api/cron/notifications</p>
            <p className="mt-1 text-sm text-neutral-500">
              Last sent: {formatDateTime(latestSent?.sentAt)}. Last failed:{" "}
              {formatDateTime(latestFailed?.createdAt)}.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="font-semibold text-neutral-950">KRA retry queue</p>
            <p className="mt-1 text-sm text-neutral-500">
              {retryableKra} retryable submission attempts are currently recorded.
            </p>
          </div>
        </div>
      </Surface>

      <Surface title="Failed notification queue">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {failedNotifications.map((item) => (
                <tr key={item.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 font-medium">{item.org.name}</td>
                  <td className="px-4 py-3 text-neutral-600">{labelize(item.type)}</td>
                  <td className="px-4 py-3 text-neutral-600">{item.channel}</td>
                  <td className="px-4 py-3 text-neutral-600">{item.title}</td>
                  <td className="px-4 py-3">
                    <Badge tone={toneForStatus(item.status)}>{item.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{formatDateTime(item.createdAt)}</td>
                </tr>
              ))}
              {failedNotifications.length === 0 ? (
                <EmptyRow colSpan={6} label="No failed notifications found." />
              ) : null}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
