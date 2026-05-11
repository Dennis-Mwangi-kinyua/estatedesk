import Link from "next/link";
import { OrganizationStatus, Prisma } from "@prisma/client";
import {
  Building2,
  ChevronRight,
  CreditCard,
  FileText,
  Home,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { getPagination } from "@/lib/db/pagination";
import {
  Badge,
  PageHeader,
  PaginationControls,
  StatCard,
  formatNumber,
  toneForStatus,
} from "../_components/control-plane";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  page?: string;
  pageSize?: string;
  q?: string;
  status?: string;
}>;

const STATUS_VALUES = Object.values(OrganizationStatus);

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(value);
}

function parseStatus(value?: string) {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  return STATUS_VALUES.find((status) => status === normalized) ?? null;
}

function buildWhere({
  q,
  status,
}: {
  q: string;
  status: OrganizationStatus | null;
}): Prisma.OrganizationWhereInput {
  const where: Prisma.OrganizationWhereInput = { deletedAt: null };

  if (status) {
    where.status = status;
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}

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
  const status = parseStatus(params.status);
  const { page, pageSize, skip, take } = getPagination({
    page: Number(params.page ?? 1),
    pageSize: Number(params.pageSize ?? 24),
  });
  const where = buildWhere({ q, status });

  const [
    organizations,
    totalFiltered,
    totalOrganizations,
    activeOrganizations,
    suspendedOrganizations,
    subscribedOrganizations,
  ] = await Promise.all([
    prisma.organization.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        subscription: {
          select: {
            id: true,
            plan: true,
            status: true,
            currentPeriodEnd: true,
          },
        },
      },
    }),
    prisma.organization.count({ where }),
    prisma.organization.count({ where: { deletedAt: null } }),
    prisma.organization.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.organization.count({ where: { deletedAt: null, status: "SUSPENDED" } }),
    prisma.subscription.count({
      where: {
        org: { deletedAt: null },
        status: { in: ["ACTIVE", "TRIALING"] },
      },
    }),
  ]);

  const orgIds = organizations.map((org) => org.id);

  const [membershipCounts, propertyCounts, leaseCounts, tenantCounts, paymentCounts] =
    orgIds.length
      ? await Promise.all([
          prisma.membership.groupBy({
            by: ["orgId"],
            where: { orgId: { in: orgIds } },
            _count: { orgId: true },
          }),
          prisma.property.groupBy({
            by: ["orgId"],
            where: { orgId: { in: orgIds }, deletedAt: null },
            _count: { orgId: true },
          }),
          prisma.lease.groupBy({
            by: ["orgId"],
            where: { orgId: { in: orgIds }, deletedAt: null },
            _count: { orgId: true },
          }),
          prisma.tenant.groupBy({
            by: ["orgId"],
            where: { orgId: { in: orgIds }, deletedAt: null },
            _count: { orgId: true },
          }),
          prisma.payment.groupBy({
            by: ["orgId"],
            where: { orgId: { in: orgIds } },
            _count: { orgId: true },
          }),
        ])
      : [[], [], [], [], []];

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
          <div className="flex flex-wrap gap-2">
            <Link
              href="/platform/organizations/new"
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
            >
              <Plus className="h-4 w-4" />
              Add organization
            </Link>
            <Link
              href="/platform/reports"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50"
            >
              <FileText className="h-4 w-4" />
              Reports
            </Link>
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Organizations" value={formatNumber(totalOrganizations)} />
        <StatCard label="Active" value={formatNumber(activeOrganizations)} />
        <StatCard label="Suspended" value={formatNumber(suspendedOrganizations)} />
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
            {STATUS_VALUES.map((value) => (
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
          <div className="grid gap-3 p-3 sm:p-4 xl:grid-cols-2 2xl:grid-cols-3">
            {organizations.map((org) => {
              const staff = membershipCountMap.get(org.id) ?? 0;
              const properties = propertyCountMap.get(org.id) ?? 0;
              const leases = leaseCountMap.get(org.id) ?? 0;
              const tenants = tenantCountMap.get(org.id) ?? 0;
              const payments = paymentCountMap.get(org.id) ?? 0;

              return (
                <Link
                  key={org.id}
                  href={`/platform/organizations/${org.id}`}
                  className="group flex min-h-[260px] flex-col rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 text-neutral-700">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-neutral-950">
                          {org.name}
                        </h2>
                        <p className="mt-1 truncate text-sm text-neutral-500">
                          /{org.slug}
                        </p>
                        <p className="mt-1 truncate text-sm text-neutral-500">
                          {org.email ?? org.phone ?? "No contact set"}
                        </p>
                      </div>
                    </div>
                    <Badge tone={toneForStatus(org.status)}>{org.status}</Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <MiniMetric icon={<Users className="h-3.5 w-3.5" />} label="Staff" value={staff} />
                    <MiniMetric icon={<Home className="h-3.5 w-3.5" />} label="Properties" value={properties} />
                    <MiniMetric icon={<FileText className="h-3.5 w-3.5" />} label="Leases" value={leases} />
                    <MiniMetric icon={<CreditCard className="h-3.5 w-3.5" />} label="Tenants" value={tenants} />
                  </div>

                  <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-500">
                          Subscription
                        </p>
                        {org.subscription ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge>{org.subscription.plan}</Badge>
                            <Badge tone={toneForStatus(org.subscription.status)}>
                              {org.subscription.status}
                            </Badge>
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-neutral-500">No subscription</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-500">
                          Payments
                        </p>
                        <p className="mt-2 text-sm font-semibold text-neutral-950">
                          {formatNumber(payments)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-4 text-xs text-neutral-500">
                    <span>Created {formatDate(org.createdAt)}</span>
                    <span className="inline-flex items-center gap-1 text-neutral-700">
                      Open
                      <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
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

function MiniMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-neutral-400">{icon}</span>
        <span className="text-sm font-semibold text-neutral-950">{value}</span>
      </div>
      <p className="mt-1 text-xs text-neutral-500">{label}</p>
    </div>
  );
}
