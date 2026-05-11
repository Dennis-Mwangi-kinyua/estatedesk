import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import {
  AdminLink,
  Badge,
  EmptyRow,
  PageHeader,
  StatCard,
  Surface,
  formatDateTime,
  formatNumber,
  toneForStatus,
} from "../_components/control-plane";

export const dynamic = "force-dynamic";

export default async function DataManagementPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const [deletedOrgs, deletedUsers, deletedTenants, assets, orgs] = await Promise.all([
    prisma.organization.count({ where: { deletedAt: { not: null } } }),
    prisma.user.count({ where: { deletedAt: { not: null } } }),
    prisma.tenant.count({ where: { deletedAt: { not: null } } }),
    prisma.asset.aggregate({ _sum: { size: true }, _count: true, where: { deletedAt: null } }),
    prisma.organization.findMany({
      where: { deletedAt: null },
      orderBy: { dataRetentionDays: "asc" },
      take: 50,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        dataRetentionDays: true,
        updatedAt: true,
        _count: {
          select: {
            assets: true,
            auditLogs: true,
            payments: true,
            tenants: true,
          },
        },
      },
    }),
  ]);

  const assetMb = Math.round(Number(assets._sum.size ?? 0) / 1024 / 1024);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Data management"
        title="Retention and recovery"
        description="Soft-deleted record visibility, retained data volumes, and organization retention policies."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Deleted organizations" value={deletedOrgs} />
        <StatCard label="Deleted users" value={deletedUsers} />
        <StatCard label="Deleted tenants" value={deletedTenants} />
        <StatCard label="Asset storage" value={`${formatNumber(assetMb)} MB`} note={`${assets._count} active files`} />
      </section>

      <Surface title="Retention overview">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Retention</th>
                <th className="px-4 py-3 font-medium">Tenants</th>
                <th className="px-4 py-3 font-medium">Payments</th>
                <th className="px-4 py-3 font-medium">Audit logs</th>
                <th className="px-4 py-3 font-medium">Assets</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3">
                    <AdminLink href={`/platform/organizations/${org.id}`}>{org.name}</AdminLink>
                    <p className="mt-1 text-xs text-neutral-500">/{org.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={toneForStatus(org.status)}>{org.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{org.dataRetentionDays} days</td>
                  <td className="px-4 py-3 text-neutral-600">{org._count.tenants}</td>
                  <td className="px-4 py-3 text-neutral-600">{org._count.payments}</td>
                  <td className="px-4 py-3 text-neutral-600">{org._count.auditLogs}</td>
                  <td className="px-4 py-3 text-neutral-600">{org._count.assets}</td>
                  <td className="px-4 py-3 text-neutral-600">{formatDateTime(org.updatedAt)}</td>
                </tr>
              ))}
              {orgs.length === 0 ? <EmptyRow colSpan={8} label="No organizations found." /> : null}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
