import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import {
  approveDataExportRequestAction,
  rejectDataExportRequestAction,
} from "./actions";
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
  await requirePlatformRole(["SUPER_ADMIN"], {
    redirectTo: "/platform/developer?error=super-admin-only",
  });

  const [deletedOrgs, deletedUsers, deletedTenants, assets, orgs, exportRequests] = await Promise.all([
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
    prisma.dataExportRequest.findMany({
      orderBy: { requestedAt: "desc" },
      take: 30,
      include: {
        org: { select: { id: true, name: true, slug: true } },
        requestedBy: { select: { fullName: true, email: true } },
        reviewedBy: { select: { fullName: true, email: true } },
      },
    }),
  ]);

  const assetMb = Math.round(Number(assets._sum.size ?? 0) / 1024 / 1024);
  const pendingExportRequests = exportRequests.filter(
    (request) => request.status === "PENDING",
  ).length;

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
        <StatCard label="Pending exports" value={pendingExportRequests} />
      </section>

      <Surface
        title="Data export requests"
        description="Organizations request a CSV archive here; platform admins approve or reject before download."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Requested by</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Reviewed</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exportRequests.map((request) => (
                <tr key={request.id} className="border-t border-neutral-100 align-top">
                  <td className="px-4 py-3">
                    <AdminLink href={`/platform/organizations/${request.org.slug}`}>{request.org.name}</AdminLink>
                    <p className="mt-1 text-xs text-neutral-500">/{request.org.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-950">{request.requestedBy.fullName}</p>
                    <p className="mt-1 text-xs text-neutral-500">{request.requestedBy.email ?? "No email"}</p>
                    <p className="mt-1 text-xs text-neutral-500">{formatDateTime(request.requestedAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={toneForStatus(request.status)}>{request.status}</Badge>
                    {request.expiresAt ? (
                      <p className="mt-2 text-xs text-neutral-500">Expires {formatDateTime(request.expiresAt)}</p>
                    ) : null}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-neutral-600">
                    {request.reason || "-"}
                    {request.reviewerNotes ? (
                      <p className="mt-2 text-xs text-neutral-500">Note: {request.reviewerNotes}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {request.reviewedAt ? formatDateTime(request.reviewedAt) : "-"}
                    {request.reviewedBy ? (
                      <p className="mt-1 text-xs text-neutral-500">{request.reviewedBy.fullName}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {request.status === "PENDING" ? (
                      <div className="flex min-w-56 flex-col gap-2">
                        <form action={approveDataExportRequestAction} className="flex gap-2">
                          <input type="hidden" name="requestId" value={request.id} />
                          <input
                            name="reviewerNotes"
                            placeholder="Approval note"
                            className="h-9 min-w-0 rounded-xl border border-neutral-200 px-3 text-xs outline-none focus:ring-2 focus:ring-neutral-200"
                          />
                          <button className="h-9 rounded-xl bg-neutral-950 px-3 text-xs font-semibold text-white" type="submit">
                            Approve
                          </button>
                        </form>
                        <form action={rejectDataExportRequestAction} className="flex gap-2">
                          <input type="hidden" name="requestId" value={request.id} />
                          <input
                            name="reviewerNotes"
                            placeholder="Rejection note"
                            className="h-9 min-w-0 rounded-xl border border-neutral-200 px-3 text-xs outline-none focus:ring-2 focus:ring-neutral-200"
                          />
                          <button className="h-9 rounded-xl border border-neutral-200 px-3 text-xs font-semibold text-neutral-700" type="submit">
                            Reject
                          </button>
                        </form>
                      </div>
                    ) : request.status === "APPROVED" ? (
                      <a
                        href={`/api/data-exports/${request.id}/download`}
                        className="inline-flex h-9 items-center rounded-xl border border-neutral-200 px-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                      >
                        Download ZIP
                      </a>
                    ) : (
                      <span className="text-xs text-neutral-500">No action</span>
                    )}
                  </td>
                </tr>
              ))}
              {exportRequests.length === 0 ? <EmptyRow colSpan={6} label="No export requests found." /> : null}
            </tbody>
          </table>
        </div>
      </Surface>

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
                <th className="px-4 py-3 font-medium">Export</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3">
                    <AdminLink href={`/platform/organizations/${org.slug}`}>{org.name}</AdminLink>
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
                  <td className="px-4 py-3">
                    <a
                      href={`/api/platform/data-exports/${org.slug}/download`}
                      className="inline-flex h-9 items-center rounded-xl border border-neutral-200 px-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                    >
                      CSV ZIP
                    </a>
                  </td>
                </tr>
              ))}
              {orgs.length === 0 ? <EmptyRow colSpan={9} label="No organizations found." /> : null}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
