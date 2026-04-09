import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function toNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value == null) return 0;
  return typeof value === "number" ? value : value.toNumber();
}

function formatCurrency(value: Prisma.Decimal | number | null | undefined) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function formatDate(date: Date | null | undefined) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function TenantDashboardPage() {
  const session = await requireUserSession();

  const tenant = await prisma.tenant.findFirst({
    where: {
      userId: session.userId,
      deletedAt: null,
    },
    include: {
      leases: {
        where: {
          deletedAt: null,
          status: "ACTIVE",
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          unit: {
            include: {
              building: true,
              property: true,
            },
          },
        },
      },
    },
  });

  if (!tenant) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        No tenant profile is linked to your account.
      </div>
    );
  }

  const activeLease = tenant.leases[0];
  const unit = activeLease?.unit;

  const [recentPayments, waterBills, issues, notifications] = await Promise.all([
    prisma.payment.findMany({
      where: {
        payerTenantId: tenant.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        amount: true,
        reference: true,
        method: true,
        gatewayStatus: true,
        verificationStatus: true,
        createdAt: true,
        paidAt: true,
      },
    }),

    prisma.waterBill.findMany({
      where: {
        tenantId: tenant.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        period: true,
        total: true,
        status: true,
        dueDate: true,
        createdAt: true,
      },
    }),

    prisma.issueTicket.findMany({
      where: {
        unitId: unit?.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
      },
    }),

    prisma.notification.findMany({
      where: {
        tenantId: tenant.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        status: true,
        createdAt: true,
        readAt: true,
      },
    }),
  ]);

  const latestWaterBill = waterBills[0];
  const lastPayment = recentPayments[0];
  const openIssuesCount = issues.filter((issue) => issue.status !== "RESOLVED" && issue.status !== "CLOSED").length;

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-neutral-200 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 p-5 text-white shadow-sm sm:p-6">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

        <div className="relative">
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm backdrop-blur">
              <span className="text-sm">🏠</span>
              <span>Tenant Portal</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm backdrop-blur">
              <span className="text-sm">💳</span>
              <span>Payments</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm backdrop-blur">
              <span className="text-sm">📄</span>
              <span>Bills & Notices</span>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium text-neutral-300">Welcome back</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {tenant.fullName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-300 sm:text-base">
              View your unit details, bills, payment activity, notices, and service requests from one clean tenant workspace.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/tenant/payments"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
            >
              View Payments
            </Link>
            <Link
              href="/dashboard/tenant/issues"
              className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
            >
              Report an Issue
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Property</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">
            {unit?.property?.name ?? "—"}
          </p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Building / Block</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">
            {unit?.building?.name ?? "—"}
          </p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Unit</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">
            {unit?.houseNo ?? "—"}
          </p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Lease Status</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">
            {activeLease?.status ?? "—"}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-neutral-500">Account Snapshot</p>
              <h2 className="text-lg font-bold tracking-tight text-neutral-900">
                Your latest information
              </h2>
            </div>
            <div className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
              Live Data
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm font-medium text-neutral-500">Monthly Rent</p>
              <p className="mt-2 text-xl font-bold text-neutral-900">
                {formatCurrency(activeLease?.monthlyRent)}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Due day: {activeLease?.dueDay ?? "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm font-medium text-neutral-500">Latest Water Bill</p>
              <p className="mt-2 text-xl font-bold text-neutral-900">
                {formatCurrency(latestWaterBill?.total)}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                {latestWaterBill?.period ?? "No recent bill"}
              </p>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm font-medium text-neutral-500">Last Payment</p>
              <p className="mt-2 text-xl font-bold text-neutral-900">
                {formatCurrency(lastPayment?.amount)}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                {lastPayment ? formatDate(lastPayment.createdAt) : "No payment yet"}
              </p>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm font-medium text-neutral-500">Open Issues</p>
              <p className="mt-2 text-xl font-bold text-neutral-900">{openIssuesCount}</p>
              <p className="mt-1 text-xs text-neutral-500">Requests still in progress.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-sm font-medium text-neutral-500">Quick Actions</p>
          <h2 className="text-lg font-bold tracking-tight text-neutral-900">
            Go to a section
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-3">
            <Link href="/dashboard/tenant/payments" className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50">💳 Payments</Link>
            <Link href="/dashboard/tenant/water-bills" className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50">💧 Water Bills</Link>
            <Link href="/dashboard/tenant/lease" className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50">📄 Lease Details</Link>
            <Link href="/dashboard/tenant/issues" className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50">🛠️ Issues</Link>
            <Link href="/dashboard/tenant/notices" className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50">📢 Notices</Link>
            <Link href="/dashboard/tenant/profile" className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50">👤 Profile</Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Recent Payments</p>
              <h2 className="text-lg font-bold tracking-tight text-neutral-900">
                Payment activity
              </h2>
            </div>
            <div className="text-2xl">💳</div>
          </div>

          <div className="mt-4 space-y-3">
            {recentPayments.length === 0 ? (
              <div className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-500">
                No payments found yet.
              </div>
            ) : (
              recentPayments.map((payment) => (
                <div key={payment.id} className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-sm font-semibold text-neutral-900">
                    {formatCurrency(payment.amount)}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {payment.method} • {payment.reference ?? "No reference"} • {formatDate(payment.createdAt)}
                  </p>
                  <p className="mt-2 text-xs font-medium text-neutral-600">
                    Gateway: {payment.gatewayStatus} • Verified: {payment.verificationStatus}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Notices & Requests</p>
              <h2 className="text-lg font-bold tracking-tight text-neutral-900">
                Latest updates
              </h2>
            </div>
            <div className="text-2xl">📬</div>
          </div>

          <div className="mt-4 space-y-3">
            {notifications.slice(0, 2).map((notice) => (
              <div key={notice.id} className="rounded-2xl bg-neutral-50 p-4">
                <p className="text-sm font-semibold text-neutral-900">{notice.title}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  {notice.type} • {formatDate(notice.createdAt)}
                </p>
              </div>
            ))}

            {issues.slice(0, 3).map((issue) => (
              <div key={issue.id} className="rounded-2xl bg-neutral-50 p-4">
                <p className="text-sm font-semibold text-neutral-900">{issue.title}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  {issue.priority} • {issue.status} • {formatDate(issue.createdAt)}
                </p>
              </div>
            ))}

            {notifications.length === 0 && issues.length === 0 ? (
              <div className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-500">
                No notices or issues yet.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}