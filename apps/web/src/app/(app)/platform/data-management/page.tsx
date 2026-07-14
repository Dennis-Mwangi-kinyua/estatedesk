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
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
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
        <div className="divide-y divide-border lg:hidden">
          {exportRequests.map((request) => (
            <article key={request.id} className="space-y-3 px-3 py-4 sm:px-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <AdminLink href={`/platform/organizations/${request.org.slug}`}>
                    <span className="break-words text-sm font-semibold leading-5">
                      {request.org.name}
                    </span>
                  </AdminLink>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    /{request.org.slug}
                  </p>
                </div>
                <Badge tone={toneForStatus(request.status)}>{request.status}</Badge>
              </div>

              <dl className="grid gap-2 rounded-xl border border-border bg-muted/30 p-3 text-xs">
                <div className="min-w-0">
                  <dt className="font-medium text-muted-foreground">Requested by</dt>
                  <dd className="mt-0.5 break-words font-semibold text-foreground">
                    {request.requestedBy.fullName}
                  </dd>
                  <dd className="break-all text-muted-foreground">
                    {request.requestedBy.email ?? "No email"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="shrink-0 font-medium text-muted-foreground">Requested</dt>
                  <dd className="text-right font-semibold text-foreground">
                    {formatDateTime(request.requestedAt)}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="font-medium text-muted-foreground">Reason</dt>
                  <dd className="mt-0.5 break-words text-foreground">
                    {request.reason || "No reason provided"}
                  </dd>
                </div>
                {request.reviewedAt || request.reviewedBy ? (
                  <div className="min-w-0">
                    <dt className="font-medium text-muted-foreground">Reviewed</dt>
                    <dd className="mt-0.5 break-words text-foreground">
                      {request.reviewedBy?.fullName ?? "Platform team"}
                      {request.reviewedAt
                        ? ` · ${formatDateTime(request.reviewedAt)}`
                        : ""}
                    </dd>
                  </div>
                ) : null}
                {request.reviewerNotes ? (
                  <div className="min-w-0">
                    <dt className="font-medium text-muted-foreground">Reviewer note</dt>
                    <dd className="mt-0.5 break-words text-foreground">
                      {request.reviewerNotes}
                    </dd>
                  </div>
                ) : null}
              </dl>

              {request.status === "PENDING" ? (
                <div className="grid gap-2 rounded-xl border border-border bg-card p-3">
                  <form action={approveDataExportRequestAction} className="grid gap-2">
                    <input type="hidden" name="requestId" value={request.id} />
                    <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                      Approval note
                      <input
                        name="reviewerNotes"
                        placeholder="Optional approval note"
                        className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30"
                      />
                    </label>
                    <button
                      className="min-h-11 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
                      type="submit"
                    >
                      Approve export
                    </button>
                  </form>
                  <form action={rejectDataExportRequestAction} className="grid gap-2 border-t border-border pt-2">
                    <input type="hidden" name="requestId" value={request.id} />
                    <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                      Rejection note
                      <input
                        name="reviewerNotes"
                        placeholder="Why is this being rejected?"
                        className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30"
                      />
                    </label>
                    <button
                      className="min-h-11 w-full rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100"
                      type="submit"
                    >
                      Reject export
                    </button>
                  </form>
                </div>
              ) : request.status === "APPROVED" ? (
                <a
                  href={`/api/data-exports/${request.id}/download`}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted/50"
                >
                  Download ZIP
                </a>
              ) : null}
            </article>
          ))}
          {exportRequests.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No export requests found.
            </p>
          ) : null}
        </div>

        <div className="hidden overflow-x-auto lg:block">
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
        <div className="divide-y divide-border lg:hidden">
          {orgs.map((org) => (
            <article key={org.id} className="space-y-3 px-3 py-4 sm:px-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <AdminLink href={`/platform/organizations/${org.slug}`}>
                    <span className="break-words text-sm font-semibold leading-5">
                      {org.name}
                    </span>
                  </AdminLink>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    /{org.slug}
                  </p>
                </div>
                <Badge tone={toneForStatus(org.status)}>{org.status}</Badge>
              </div>

              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                  <dt className="text-muted-foreground">Retention</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">
                    {org.dataRetentionDays} days
                  </dd>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                  <dt className="text-muted-foreground">Tenants</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{org._count.tenants}</dd>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                  <dt className="text-muted-foreground">Payments</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{org._count.payments}</dd>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                  <dt className="text-muted-foreground">Files / audit logs</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">
                    {org._count.assets} / {org._count.auditLogs}
                  </dd>
                </div>
              </dl>

              <p className="text-xs text-muted-foreground">
                Updated <span className="font-medium text-foreground">{formatDateTime(org.updatedAt)}</span>
              </p>
              <a
                href={`/api/platform/data-exports/${org.slug}/download`}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted/50"
              >
                Download CSV ZIP
              </a>
            </article>
          ))}
          {orgs.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No organizations found.
            </p>
          ) : null}
        </div>

        <div className="hidden overflow-x-auto lg:block">
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
