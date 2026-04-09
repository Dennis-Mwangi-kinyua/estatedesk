import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Building2,
  CreditCard,
  Home,
  Users,
  Wrench,
  ChevronRight,
  ReceiptText,
} from "lucide-react";
import { redirect } from "next/navigation";
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

async function getOrgDashboardStats(orgId: string) {
  const now = new Date();
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    totalTenants,
    activeTenants,
    totalUnits,
    occupiedUnits,
    vacantUnits,
    openIssues,
    urgentIssues,
    pendingPayments,
    recentTenants,
    recentIssues,
    recentNotifications,
    unreadNotifications,
    activeLeases,
    overdueRentCharges,
    dueSoonRentCharges,
    pendingWaterBills,
    recentPayments,
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

    prisma.tenant.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      where: {
        orgId,
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
        createdAt: true,
        leases: {
          where: {
            status: "ACTIVE",
            deletedAt: null,
            orgId,
          },
          take: 1,
          select: {
            unit: {
              select: {
                houseNo: true,
                property: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    }),

    prisma.issueTicket.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      where: {
        orgId,
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
      },
    }),

    prisma.notification.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      where: {
        orgId,
      },
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        channel: true,
        status: true,
        readAt: true,
        createdAt: true,
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

    prisma.rentCharge.count({
      where: {
        orgId,
        status: {
          in: ["UNPAID", "PARTIAL", "OVERDUE"],
        },
        dueDate: {
          lt: now,
        },
      },
    }),

    prisma.rentCharge.count({
      where: {
        orgId,
        status: {
          in: ["UNPAID", "PARTIAL"],
        },
        dueDate: {
          gte: now,
          lte: next7Days,
        },
      },
    }),

    prisma.waterBill.count({
      where: {
        orgId,
        status: {
          in: ["ISSUED", "PAYMENT_PENDING", "PAID_PENDING_VERIFICATION"],
        },
      },
    }),

    prisma.payment.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      where: {
        orgId,
      },
      select: {
        id: true,
        amount: true,
        method: true,
        targetType: true,
        gatewayStatus: true,
        verificationStatus: true,
        createdAt: true,
        payerTenant: {
          select: {
            fullName: true,
          },
        },
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
    recentTenants,
    recentIssues,
    recentNotifications,
    unreadNotifications,
    activeLeases,
    overdueRentCharges,
    dueSoonRentCharges,
    pendingWaterBills,
    recentPayments,
    occupancyRate,
  };
}

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

function formatNotificationType(type: string) {
  return type.replaceAll("_", " ");
}

export default async function OrganizationDashboardPage() {
  const membership = await getCurrentOrgContext();
  const data = await getOrgDashboardStats(membership.orgId);

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

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm xl:col-span-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-950 sm:text-lg">
                Billing Snapshot
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Rent and utility items needing attention
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-800">
              <ReceiptText className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">Overdue Rent Charges</p>
              <p className="mt-2 text-2xl font-semibold text-neutral-950">
                {data.overdueRentCharges}
              </p>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">Due in 7 Days</p>
              <p className="mt-2 text-2xl font-semibold text-neutral-950">
                {data.dueSoonRentCharges}
              </p>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">Pending Water Bills</p>
              <p className="mt-2 text-2xl font-semibold text-neutral-950">
                {data.pendingWaterBills}
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/org/notifications"
          className="group rounded-3xl border border-black/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md xl:col-span-8"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                <Bell className="h-3.5 w-3.5" />
                Notifications
              </div>

              <h2 className="mt-3 text-base font-semibold text-neutral-950 sm:text-lg">
                Notification Center
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-neutral-500">
                Review unread alerts, delivery status, and recent organization
                communication from one place.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 transition group-hover:text-neutral-950">
              <span>Open</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">Unread Alerts</p>
              <p className="mt-2 text-2xl font-semibold text-neutral-950">
                {data.unreadNotifications}
              </p>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">Recent Items</p>
              <p className="mt-2 text-2xl font-semibold text-neutral-950">
                {data.recentNotifications.length}
              </p>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">Latest Channel</p>
              <p className="mt-2 text-sm font-semibold text-neutral-950">
                {data.recentNotifications[0]?.channel ?? "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">Latest Status</p>
              <p className="mt-2 text-sm font-semibold text-neutral-950">
                {data.recentNotifications[0]?.status ?? "—"}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {data.recentNotifications.length === 0 ? (
              <p className="text-sm text-neutral-500">No notifications yet.</p>
            ) : (
              data.recentNotifications.slice(0, 3).map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-2xl border border-black/5 bg-neutral-50 px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-neutral-700">
                      <Bell className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-neutral-950">
                          {notification.title}
                        </p>
                        {!notification.readAt && (
                          <span className="rounded-full bg-neutral-950 px-2 py-0.5 text-[10px] font-medium text-white">
                            New
                          </span>
                        )}
                      </div>

                      <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
                        {notification.message}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                        <span>{formatNotificationType(notification.type)}</span>
                        <span>•</span>
                        <span>{notification.channel}</span>
                        <span>•</span>
                        <span>{notification.status}</span>
                        <span>•</span>
                        <span>
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-neutral-950 sm:text-lg">
            Recent Tenants
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Latest tenant records added
          </p>

          <div className="mt-5 space-y-3">
            {data.recentTenants.length === 0 ? (
              <p className="text-sm text-neutral-500">No tenants yet.</p>
            ) : (
              data.recentTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-neutral-50 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-950">
                      {tenant.fullName}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {tenant.leases[0]?.unit?.houseNo
                        ? `${tenant.leases[0].unit.property.name} • Unit ${tenant.leases[0].unit.houseNo}`
                        : "No active unit"}
                    </p>
                  </div>

                  <span className="shrink-0 text-xs text-neutral-400">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-neutral-950 sm:text-lg">
            Recent Issues
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Latest reported issue tickets
          </p>

          <div className="mt-5 space-y-3">
            {data.recentIssues.length === 0 ? (
              <p className="text-sm text-neutral-500">No issues reported yet.</p>
            ) : (
              data.recentIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-start gap-3 rounded-2xl border border-black/5 bg-neutral-50 px-4 py-3"
                >
                  <div className="mt-0.5 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-950">
                      {issue.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                      <span>{issue.status.replaceAll("_", " ")}</span>
                      <span>•</span>
                      <span>{issue.priority}</span>
                      <span>•</span>
                      <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-neutral-950 sm:text-lg">
          Recent Payments
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Latest payment activity in the organization
        </p>

        <div className="mt-5 space-y-3">
          {data.recentPayments.length === 0 ? (
            <p className="text-sm text-neutral-500">No payments yet.</p>
          ) : (
            data.recentPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-neutral-50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-950">
                    {payment.payerTenant.fullName}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {payment.targetType} • {payment.method} •{" "}
                    {payment.gatewayStatus} / {payment.verificationStatus}
                  </p>
                </div>

                <span className="shrink-0 text-sm font-medium text-neutral-900">
                  {membership.org.currencyCode}{" "}
                  {Number(payment.amount).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}