import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import {
  Building2,
  Search,
  Filter,
  Users,
  Home,
  FileText,
  CreditCard,
  Plus,
  ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-KE").format(value);
}

function getStatusTone(status: string | null | undefined) {
  const value = (status ?? "").toLowerCase();

  if (["active", "enabled"].includes(value)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (["pending", "trialing", "draft"].includes(value)) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (["inactive", "suspended", "cancelled", "canceled", "failed"].includes(value)) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-stone-200 bg-stone-100 text-stone-700";
}

export default async function PlatformOrganizationsPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const organizations = await prisma.organization.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
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
  });

  const orgIds = organizations.map((org) => org.id);

  const [
    membershipCounts,
    propertyCounts,
    leaseCounts,
    tenantCounts,
    paymentCounts,
  ] = orgIds.length
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

  const totalOrganizations = organizations.length;
  const activeOrganizations = organizations.filter(
    (org) => (org.status ?? "").toUpperCase() === "ACTIVE",
  ).length;
  const subscribedOrganizations = organizations.filter(
    (org) => Boolean(org.subscription),
  ).length;
  const totalProperties = Array.from(propertyCountMap.values()).reduce(
    (sum, value) => sum + value,
    0,
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fafaf9_0%,#f5f5f4_35%,#f1f5f9_100%)] text-stone-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(250,250,249,0.94)_100%)] p-5 shadow-[0_14px_40px_rgba(28,25,23,0.08)] backdrop-blur xl:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-stone-200/80 bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-600 shadow-sm">
                  <Building2 className="h-3.5 w-3.5" />
                  Platform directory
                </span>

                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950 lg:text-4xl">
                  Registered organizations
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
                  A premium overview of every workspace on the platform, with
                  subscription health, operational footprint, and portfolio scale
                  in one polished directory.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/platform/organizations/new"
                  className="inline-flex items-center gap-2 rounded-2xl bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(28,25,23,0.18)] transition hover:-translate-y-0.5 hover:bg-stone-800"
                >
                  <Plus className="h-4 w-4" />
                  Add organization
                </Link>

                <Link
                  href="/platform/reports"
                  className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50"
                >
                  <FileText className="h-4 w-4" />
                  View reports
                </Link>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <PremiumStatCard
                icon={<Building2 className="h-4 w-4" />}
                label="Organizations"
                value={formatNumber(totalOrganizations)}
                helper="Registered workspaces"
              />
              <PremiumStatCard
                icon={<Users className="h-4 w-4" />}
                label="Active"
                value={formatNumber(activeOrganizations)}
                helper="Currently enabled"
              />
              <PremiumStatCard
                icon={<CreditCard className="h-4 w-4" />}
                label="Subscribed"
                value={formatNumber(subscribedOrganizations)}
                helper="With active billing"
              />
              <PremiumStatCard
                icon={<Home className="h-4 w-4" />}
                label="Properties"
                value={formatNumber(totalProperties)}
                helper="Managed inventory"
              />
            </div>
          </section>

          <section className="rounded-[30px] border border-white/70 bg-white/95 p-4 shadow-[0_12px_32px_rgba(28,25,23,0.06)] backdrop-blur lg:p-5">
            <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
              <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 shadow-sm">
                <Search className="h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search organizations..."
                  className="w-full bg-transparent text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none"
                />
              </div>

              <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50">
                <Filter className="h-4 w-4" />
                Filter by status
              </button>

              <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50">
                Newest first
              </button>
            </div>

            {organizations.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-stone-200 bg-stone-50 px-4 py-12 text-center text-sm text-stone-500">
                No organizations found.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
                      className="group relative block overflow-hidden rounded-[28px] border border-stone-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#fafaf9_100%)] p-4 shadow-[0_8px_22px_rgba(28,25,23,0.05)] transition duration-200 hover:-translate-y-1 hover:border-stone-300 hover:shadow-[0_18px_38px_rgba(28,25,23,0.10)]"
                    >
                      <div className="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top_right,rgba(24,24,27,0.05),transparent_55%)]" />

                      <div className="relative">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-white shadow-sm">
                              <Building2 className="h-5 w-5 text-stone-700" />
                            </div>

                            <div className="min-w-0">
                              <h3 className="truncate text-[15px] font-semibold text-stone-950">
                                {org.name}
                              </h3>
                              <p className="mt-1 truncate text-sm text-stone-500">
                                {org.email ?? "No email provided"}
                              </p>
                              <p className="mt-1 truncate text-[11px] uppercase tracking-[0.16em] text-stone-400">
                                {org.slug}
                              </p>
                            </div>
                          </div>

                          <StatusBadge tone={getStatusTone(org.status)}>
                            {org.status ?? "Unknown"}
                          </StatusBadge>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <MiniMetric
                            icon={<Users className="h-3.5 w-3.5" />}
                            label="Staff"
                            value={staff}
                          />
                          <MiniMetric
                            icon={<Home className="h-3.5 w-3.5" />}
                            label="Properties"
                            value={properties}
                          />
                          <MiniMetric
                            icon={<FileText className="h-3.5 w-3.5" />}
                            label="Leases"
                            value={leases}
                          />
                          <MiniMetric
                            icon={<CreditCard className="h-3.5 w-3.5" />}
                            label="Tenants"
                            value={tenants}
                          />
                        </div>

                        <div className="mt-4 rounded-[20px] border border-stone-200/80 bg-stone-50/80 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                                Subscription
                              </p>

                              {org.subscription ? (
                                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-stone-700 shadow-sm">
                                    {org.subscription.plan}
                                  </span>
                                  <StatusBadge
                                    tone={getStatusTone(org.subscription.status)}
                                  >
                                    {org.subscription.status}
                                  </StatusBadge>
                                </div>
                              ) : (
                                <p className="mt-1.5 text-sm text-stone-500">
                                  No active subscription
                                </p>
                              )}
                            </div>

                            <div className="text-right">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                                Payments
                              </p>
                              <p className="mt-1 text-sm font-semibold text-stone-800">
                                {formatNumber(payments)}
                              </p>
                            </div>
                          </div>

                          {org.subscription ? (
                            <p className="mt-2 text-xs text-stone-500">
                              Ends {formatDate(org.subscription.currentPeriodEnd)}
                            </p>
                          ) : null}
                        </div>

                        <div className="mt-4 flex items-center justify-between text-xs text-stone-500">
                          <span>{formatDate(org.createdAt)}</span>
                          <div className="flex items-center gap-1 text-stone-700">
                            <span className="truncate max-w-[140px]">
                              {org.timezone ?? "No timezone"}
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 text-stone-400 transition group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function PremiumStatCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[22px] border border-stone-200/80 bg-white/90 p-3.5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 text-stone-700">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
        {value}
      </p>
      <p className="mt-1 text-xs text-stone-500">{helper}</p>
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
    <div className="rounded-[16px] border border-stone-200 bg-white px-3 py-2 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-stone-400">{icon}</span>
        <span className="text-sm font-semibold text-stone-800">{value}</span>
      </div>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-stone-400">
        {label}
      </p>
    </div>
  );
}

function StatusBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${tone}`}
    >
      {children}
    </span>
  );
}