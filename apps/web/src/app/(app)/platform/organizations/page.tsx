import Link from "next/link";
import { FileText, Plus, Search } from "lucide-react";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { OrganizationWorkspaceCard } from "../_components/organization-workspace-card";
import {
  PageHeader,
  PaginationControls,
  StatCard,
  formatNumber,
} from "../_components/control-plane";
import {
  ORGANIZATION_STATUS_VALUES,
  parseOrganizationStatus,
} from "./_lib/helpers";
import { getPlatformOrganizationsPageData } from "./_lib/queries";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  page?: string;
  pageSize?: string;
  q?: string;
  status?: string;
  deleted?: string;
  archived?: string;
}>;

export default async function PlatformOrganizationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const status = parseOrganizationStatus(params.status);
  const deletedSlug = (params.deleted ?? "").trim();
  const archivedSlug = (params.archived ?? "").trim();
  const page = Number(params.page ?? 1);
  const pageSize = Number(params.pageSize ?? 24);

  const {
    organizations,
    totalFiltered,
    organizationStats,
    membershipCounts,
    propertyCounts,
    leaseCounts,
    tenantCounts,
    paymentCounts,
  } = await getPlatformOrganizationsPageData({
    q,
    status,
    page,
    pageSize,
  });

  const {
    totalOrganizations,
    activeOrganizations,
    suspendedOrganizations,
    archivedOrganizations,
    subscribedOrganizations,
  } = organizationStats;

  const membershipCountMap = new Map(
    membershipCounts.map((item) => [item.orgId, item._count.orgId]),
  );
  const propertyCountMap = new Map(
    propertyCounts.map((item) => [item.orgId, item._count.orgId]),
  );
  const leaseCountMap = new Map(
    leaseCounts.map((item) => [item.orgId, item._count.orgId]),
  );
  const tenantCountMap = new Map(
    tenantCounts.map((item) => [item.orgId, item._count.orgId]),
  );
  const paymentCountMap = new Map(
    paymentCounts.map((item) => [item.orgId, item._count.orgId]),
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Platform directory"
        title="Organizations"
        description="Search, review, and open organization workspaces without loading the whole platform into one request."
        action={
          <div className="platform-action-group">
            <Link
              href="/platform/organizations/new"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
            >
              <Plus className="h-4 w-4" />
              Add organization
            </Link>
            <Link
              href="/platform/reports"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50"
            >
              <FileText className="h-4 w-4" />
              Reports
            </Link>
          </div>
        }
      />

      {deletedSlug ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-300/30 dark:bg-emerald-300/10 dark:text-emerald-100">
          Organization /{deletedSlug} was permanently deleted. The directory has been refreshed.
        </div>
      ) : null}

      {archivedSlug ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-100">
          Organization /{archivedSlug} was archived. Its users will now see the service termination notice at login.
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Organizations" value={formatNumber(totalOrganizations)} />
        <StatCard label="Active" value={formatNumber(activeOrganizations)} />
        <StatCard label="Suspended" value={formatNumber(suspendedOrganizations)} />
        <StatCard label="Archived" value={formatNumber(archivedOrganizations)} />
        <StatCard label="Subscribed" value={formatNumber(subscribedOrganizations)} />
      </section>

      <section className="overflow-hidden rounded-[26px] border border-neutral-200 bg-white/95 shadow-sm backdrop-blur">
        <form className="grid gap-3 border-b border-neutral-200 p-4 md:grid-cols-[1fr_180px_auto]">
          <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <Search className="h-4 w-4 text-neutral-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search name, slug, email, or phone"
              className="min-w-0 flex-1 bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
            />
          </div>

          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-700 outline-none"
          >
            <option value="">All statuses</option>
            {ORGANIZATION_STATUS_VALUES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <button className="rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800">
            Apply
          </button>
        </form>

        {organizations.length === 0 ? (
          <div className="p-10 text-center text-sm text-neutral-500">
            No organizations match the current filters.
          </div>
        ) : (
          <div className="space-y-3 p-3 sm:p-4">
            {organizations.map((org) => (
              <OrganizationWorkspaceCard
                key={org.id}
                layout="wide"
                href={`/platform/organizations/${org.slug}`}
                name={org.name}
                slug={org.slug}
                email={org.email}
                phone={org.phone}
                status={org.status}
                timezone={org.timezone}
                createdAt={org.createdAt}
                metrics={{
                  properties: propertyCountMap.get(org.id) ?? 0,
                  tenants: tenantCountMap.get(org.id) ?? 0,
                  leases: leaseCountMap.get(org.id) ?? 0,
                  staff: membershipCountMap.get(org.id) ?? 0,
                  payments: paymentCountMap.get(org.id) ?? 0,
                }}
                subscription={org.subscription}
              />
            ))}
          </div>
        )}

        <PaginationControls
          page={page}
          pageSize={pageSize}
          total={totalFiltered}
          basePath="/platform/organizations"
          query={{ q, status }}
        />
      </section>
    </div>
  );
}
