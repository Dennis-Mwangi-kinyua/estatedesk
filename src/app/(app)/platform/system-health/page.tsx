import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import {
  Badge,
  EmptyRow,
  PageHeader,
  StatCard,
  Surface,
  formatDateTime,
  formatNumber,
  labelize,
  toneForStatus,
} from "../_components/control-plane";

export const dynamic = "force-dynamic";

export default async function SystemHealthPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const [orgs, users, queued, failed, sentToday, failedPayments, kraErrors, latestAudit] =
    await Promise.all([
      prisma.organization.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.notification.count({ where: { status: "QUEUED" } }),
      prisma.notification.count({ where: { status: "FAILED" } }),
      prisma.notification.count({ where: { status: "SENT", sentAt: { gte: dayAgo } } }),
      prisma.payment.count({ where: { gatewayStatus: "FAILED" } }),
      prisma.kraIntegration.findMany({
        where: { OR: [{ status: "ERROR" }, { lastError: { not: null } }] },
        orderBy: { updatedAt: "desc" },
        take: 8,
        include: { org: { select: { name: true, slug: true } } },
      }),
      prisma.auditLog.findFirst({
        orderBy: { createdAt: "desc" },
        select: { createdAt: true, action: true, org: { select: { name: true } } },
      }),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System health"
        title="Operational status"
        description="Live health indicators for the database-backed control plane, notification queue, payment failures, and KRA integration errors."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Organizations" value={formatNumber(orgs)} />
        <StatCard label="Users" value={formatNumber(users)} />
        <StatCard label="Queued notifications" value={formatNumber(queued)} />
        <StatCard label="Failed notifications" value={formatNumber(failed)} />
        <StatCard label="Sent in 24h" value={formatNumber(sentToday)} />
        <StatCard label="Failed payments" value={formatNumber(failedPayments)} />
        <StatCard label="KRA integration errors" value={formatNumber(kraErrors.length)} />
        <StatCard
          label="Latest audit"
          value={latestAudit ? labelize(latestAudit.action) : "-"}
          note={latestAudit ? `${latestAudit.org.name} • ${formatDateTime(latestAudit.createdAt)}` : undefined}
        />
      </section>

      <Surface title="KRA integration alerts">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Environment</th>
                <th className="px-4 py-3 font-medium">Last sync</th>
                <th className="px-4 py-3 font-medium">Last error</th>
              </tr>
            </thead>
            <tbody>
              {kraErrors.map((item) => (
                <tr key={item.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 font-medium">{item.org.name}</td>
                  <td className="px-4 py-3">
                    <Badge tone={toneForStatus(item.status)}>{item.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{item.environment}</td>
                  <td className="px-4 py-3 text-neutral-600">{formatDateTime(item.lastSyncAt)}</td>
                  <td className="px-4 py-3 text-neutral-600">{item.lastError ?? "-"}</td>
                </tr>
              ))}
              {kraErrors.length === 0 ? (
                <EmptyRow colSpan={5} label="No KRA integration errors recorded." />
              ) : null}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
