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

function getStatusTone(status: string | null | undefined) {
  switch (status) {
    case "ACTIVE":
    case "PAID_VERIFIED":
    case "VERIFIED":
    case "SUCCESS":
    case "RESOLVED":
    case "CLOSED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "PENDING":
    case "PAYMENT_PENDING":
    case "PAID_PENDING_VERIFICATION":
    case "IN_PROGRESS":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "OVERDUE":
    case "FAILED":
    case "REJECTED":
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-neutral-100 text-neutral-700 border-neutral-200";
  }
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
      <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
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
  const openIssuesCount = issues.filter(
    (issue) => issue.status !== "RESOLVED" && issue.status !== "CLOSED"
  ).length;

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="rounded-[32px] border border-neutral-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-pink-200 bg-pink-50 px-3 py-1.5 text-xs font-medium text-pink-700">
                👋 Welcome
              </span>
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700">
                🏠 Tenant Space
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                ✨ Live
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
              Hi, {tenant.fullName}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600 sm:text-base">
              Everything about your home is in one place — payments, lease details, notices, bills, and requests.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700">
                📍 {unit?.property?.name ?? "No property assigned"}
              </span>
              <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700">
                🧱 {unit?.building?.name ?? "No block assigned"}
              </span>
              <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700">
                🚪 Unit {unit?.houseNo ?? "—"}
              </span>
              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${getStatusTone(
                  activeLease?.status
                )}`}
              >
                📄 Lease {activeLease?.status ?? "—"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[340px]">
            <Link
              href="/dashboard/tenant/payments"
              className="inline-flex items-center justify-center rounded-[24px] bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 active:scale-[0.99]"
            >
              💳 View Payments
            </Link>
            <Link
              href="/dashboard/tenant/issues"
              className="inline-flex items-center justify-center rounded-[24px] border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50 active:scale-[0.99]"
            >
              🛠️ Report Issue
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="rounded-[26px] border border-neutral-200/80 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Monthly Rent</p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
            {formatCurrency(activeLease?.monthlyRent)}
          </p>
          <p className="mt-1 text-xs text-neutral-500">📅 Due day {activeLease?.dueDay ?? "—"}</p>
        </div>

        <div className="rounded-[26px] border border-neutral-200/80 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Water Bill</p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
            {formatCurrency(latestWaterBill?.total)}
          </p>
          <p className="mt-1 text-xs text-neutral-500">💧 {latestWaterBill?.period ?? "No recent bill"}</p>
        </div>

        <div className="rounded-[26px] border border-neutral-200/80 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Last Payment</p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
            {formatCurrency(lastPayment?.amount)}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            ✅ {lastPayment ? formatDate(lastPayment.createdAt) : "No payment yet"}
          </p>
        </div>

        <div className="rounded-[26px] border border-neutral-200/80 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Open Issues</p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
            {openIssuesCount}
          </p>
          <p className="mt-1 text-xs text-neutral-500">🧰 Requests in progress</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-[30px] border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-neutral-500">Overview</p>
              <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
                Account snapshot
              </h2>
            </div>
            <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
              📡 Live data
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] bg-neutral-50 p-4">
              <p className="text-sm font-medium text-neutral-500">Property</p>
              <p className="mt-2 text-lg font-semibold text-neutral-950">
                {unit?.property?.name ?? "—"}
              </p>
              <p className="mt-1 text-xs text-neutral-500">🏠 Assigned property</p>
            </div>

            <div className="rounded-[24px] bg-neutral-50 p-4">
              <p className="text-sm font-medium text-neutral-500">Building / Block</p>
              <p className="mt-2 text-lg font-semibold text-neutral-950">
                {unit?.building?.name ?? "—"}
              </p>
              <p className="mt-1 text-xs text-neutral-500">🧱 Current block</p>
            </div>

            <div className="rounded-[24px] bg-neutral-50 p-4">
              <p className="text-sm font-medium text-neutral-500">Unit</p>
              <p className="mt-2 text-lg font-semibold text-neutral-950">
                {unit?.houseNo ?? "—"}
              </p>
              <p className="mt-1 text-xs text-neutral-500">🚪 Occupied unit</p>
            </div>

            <div className="rounded-[24px] bg-neutral-50 p-4">
              <p className="text-sm font-medium text-neutral-500">Lease Status</p>
              <div className="mt-2">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusTone(
                    activeLease?.status
                  )}`}
                >
                  📄 {activeLease?.status ?? "—"}
                </span>
              </div>
              <p className="mt-2 text-xs text-neutral-500">Current lease state</p>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium text-neutral-500">Quick Actions</p>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
            Jump to a section
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-3">
            <Link href="/dashboard/tenant/payments" className="rounded-[22px] border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800 transition hover:bg-sky-100">
              💳 Payments
            </Link>
            <Link href="/dashboard/tenant/water-bills" className="rounded-[22px] border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100">
              💧 Water Bills
            </Link>
            <Link href="/dashboard/tenant/lease" className="rounded-[22px] border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800 transition hover:bg-violet-100">
              📄 Lease Details
            </Link>
            <Link href="/dashboard/tenant/issues" className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100">
              🛠️ Issues
            </Link>
            <Link href="/dashboard/tenant/notices" className="rounded-[22px] border border-pink-200 bg-pink-50 px-4 py-3 text-sm font-semibold text-pink-800 transition hover:bg-pink-100">
              📢 Notices
            </Link>
            <Link href="/dashboard/tenant/profile" className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100">
              👤 Profile
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[30px] border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Recent Payments</p>
              <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
                Payment activity
              </h2>
            </div>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
              💳 Latest
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {recentPayments.length === 0 ? (
              <div className="rounded-[24px] bg-neutral-50 p-4 text-sm text-neutral-500">
                No payments found yet.
              </div>
            ) : (
              recentPayments.map((payment) => (
                <div key={payment.id} className="rounded-[24px] bg-neutral-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-950">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {payment.method} • {payment.reference ?? "No reference"} • {formatDate(payment.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusTone(
                        payment.verificationStatus
                      )}`}
                    >
                      {payment.verificationStatus}
                    </span>
                  </div>

                  <p className="mt-3 text-xs font-medium text-neutral-600">
                    Gateway: {payment.gatewayStatus}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[30px] border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Updates</p>
              <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
                Notices & requests
              </h2>
            </div>
            <span className="rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-medium text-pink-700">
              🔔 Recent
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {notifications.slice(0, 2).map((notice) => (
              <div key={notice.id} className="rounded-[24px] bg-neutral-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-950">{notice.title}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {notice.type} • {formatDate(notice.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusTone(
                      notice.status
                    )}`}
                  >
                    {notice.status}
                  </span>
                </div>
              </div>
            ))}

            {issues.slice(0, 3).map((issue) => (
              <div key={issue.id} className="rounded-[24px] bg-neutral-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-950">{issue.title}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {issue.priority} • {formatDate(issue.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusTone(
                      issue.status
                    )}`}
                  >
                    {issue.status}
                  </span>
                </div>
              </div>
            ))}

            {notifications.length === 0 && issues.length === 0 ? (
              <div className="rounded-[24px] bg-neutral-50 p-4 text-sm text-neutral-500">
                No notices or issues yet.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}