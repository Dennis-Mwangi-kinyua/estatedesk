import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CreditCard,
  Home,
  Users,
  Wrench,
} from "lucide-react";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";

async function getCurrentOrgContext() {
  const session = await requireUserSession();

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId ?? undefined,
      role: {
        in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
      },
      org: {
        deletedAt: null,
        status: "ACTIVE",
      },
      user: {
        deletedAt: null,
      },
    },
    select: {
      orgId: true,
      role: true,
      org: {
        select: {
          id: true,
          name: true,
          slug: true,
          currencyCode: true,
          timezone: true,
        },
      },
    },
  });

  if (membership) {
    return membership;
  }

  const fallbackMembership = await prisma.membership.findFirst({
    where: {
      userId: session.userId,
      role: {
        in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
      },
      org: {
        deletedAt: null,
        status: "ACTIVE",
      },
      user: {
        deletedAt: null,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      orgId: true,
      role: true,
      org: {
        select: {
          id: true,
          name: true,
          slug: true,
          currencyCode: true,
          timezone: true,
        },
      },
    },
  });

  if (!fallbackMembership) {
    redirect("/dashboard");
  }

  return fallbackMembership;
}

const getOrgDashboardSummary = unstable_cache(
  async (orgId: string) => {
    const [
      totalTenants,
      activeTenants,
      totalUnits,
      occupiedUnits,
      vacantUnits,
      openIssues,
      urgentIssues,
      pendingPayments,
      unreadNotifications,
      activeLeases,
    ] = await Promise.all([
      prisma.tenant.count({
        where: {
          orgId,
          deletedAt: null,
        },
      }),

      prisma.tenant.count({
        where: {
          orgId,
          deletedAt: null,
          status: "ACTIVE",
        },
      }),

      prisma.unit.count({
        where: {
          deletedAt: null,
          isActive: true,
          property: {
            orgId,
            deletedAt: null,
          },
        },
      }),

      prisma.unit.count({
        where: {
          deletedAt: null,
          isActive: true,
          status: "OCCUPIED",
          property: {
            orgId,
            deletedAt: null,
          },
        },
      }),

      prisma.unit.count({
        where: {
          deletedAt: null,
          isActive: true,
          status: "VACANT",
          property: {
            orgId,
            deletedAt: null,
          },
        },
      }),

      prisma.issueTicket.count({
        where: {
          orgId,
          status: {
            in: ["OPEN", "IN_PROGRESS"],
          },
        },
      }),

      prisma.issueTicket.count({
        where: {
          orgId,
          status: {
            in: ["OPEN", "IN_PROGRESS"],
          },
          priority: "URGENT",
        },
      }),

      prisma.payment.count({
        where: {
          orgId,
          OR: [
            {
              gatewayStatus: {
                in: ["INITIATED", "PENDING"],
              },
            },
            {
              gatewayStatus: "SUCCESS",
              verificationStatus: "PENDING",
            },
          ],
        },
      }),

      prisma.notification.count({
        where: {
          orgId,
          readAt: null,
        },
      }),

      prisma.lease.count({
        where: {
          orgId,
          deletedAt: null,
          status: "ACTIVE",
        },
      }),
    ]);

    const occupancyRate =
      totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    return {
      totalTenants,
      activeTenants,
      totalUnits,
      occupiedUnits,
      vacantUnits,
      openIssues,
      urgentIssues,
      pendingPayments,
      unreadNotifications,
      activeLeases,
      occupancyRate,
    };
  },
  ["org-dashboard-summary"],
  {
    revalidate: 60,
  },
);

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-neutral-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
            {value}
          </p>
          <p className="mt-2 text-xs text-neutral-500 sm:text-sm">{subtitle}</p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-800">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default async function OrganizationDashboardPage() {
  const membership = await getCurrentOrgContext();
  const data = await getOrgDashboardSummary(membership.orgId);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-black/10 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 p-5 text-white shadow-sm sm:p-6">
        <div className="space-y-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                <Building2 className="h-3.5 w-3.5" />
                {membership.org.name} Dashboard
              </div>

              <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                Welcome back
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/70 sm:text-base">
                Monitor tenants, occupancy, payments, support activity, and alerts
                from one professional workspace.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm sm:p-4">
                <p className="text-xs text-white/60">Tenants</p>
                <p className="mt-2 text-lg font-semibold sm:text-xl">
                  {data.totalTenants}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm sm:p-4">
                <p className="text-xs text-white/60">Units</p>
                <p className="mt-2 text-lg font-semibold sm:text-xl">
                  {data.totalUnits}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm sm:p-4">
                <p className="text-xs text-white/60">Occupied</p>
                <p className="mt-2 text-lg font-semibold sm:text-xl">
                  {data.occupiedUnits}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm sm:p-4">
                <p className="text-xs text-white/60">Unread Alerts</p>
                <p className="mt-2 text-lg font-semibold sm:text-xl">
                  {data.unreadNotifications}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active Tenants"
          value={data.activeTenants}
          subtitle={`${data.totalTenants} total tenant records`}
          icon={Users}
        />
        <StatCard
          title="Occupied Units"
          value={data.occupiedUnits}
          subtitle={`${data.occupancyRate}% occupancy`}
          icon={Home}
        />
        <StatCard
          title="Pending Payments"
          value={data.pendingPayments}
          subtitle="Awaiting processing or verification"
          icon={CreditCard}
        />
        <StatCard
          title="Open Issues"
          value={data.openIssues}
          subtitle={`${data.urgentIssues} urgent`}
          icon={Wrench}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm xl:col-span-8">
          <div>
            <h2 className="text-base font-semibold text-neutral-950 sm:text-lg">
              Occupancy Overview
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Current unit utilization across the organization
            </p>
          </div>

          <div className="mt-6">
            <div className="overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-3 rounded-full bg-neutral-950 transition-all"
                style={{ width: `${data.occupancyRate}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-neutral-600">
              <span>{data.occupiedUnits} occupied</span>
              <span>{data.vacantUnits} vacant</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">Total Units</p>
              <p className="mt-2 text-xl font-semibold text-neutral-950">
                {data.totalUnits}
              </p>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">Occupied</p>
              <p className="mt-2 text-xl font-semibold text-neutral-950">
                {data.occupiedUnits}
              </p>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">Vacant</p>
              <p className="mt-2 text-xl font-semibold text-neutral-950">
                {data.vacantUnits}
              </p>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">Active Leases</p>
              <p className="mt-2 text-xl font-semibold text-neutral-950">
                {data.activeLeases}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm xl:col-span-4">
          <h2 className="text-base font-semibold text-neutral-950 sm:text-lg">
            Quick Actions
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Common organization tasks
          </p>

          <div className="mt-5 grid gap-3">
            <Link
              href="/dashboard/org/tenants/new"
              className="inline-flex items-center justify-between rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              <span>Add Tenant</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/dashboard/org/tenants"
              className="inline-flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
            >
              <span>View Tenants</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/dashboard/org/units"
              className="inline-flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
            >
              <span>Manage Units</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/dashboard/org/settings"
              className="inline-flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
            >
              <span>Organization Settings</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}