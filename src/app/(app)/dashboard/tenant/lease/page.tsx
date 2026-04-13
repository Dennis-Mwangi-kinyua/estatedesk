import Link from "next/link";
import type { ReactNode } from "react";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { Prisma, LeaseStatus, ChargeStatus } from "@prisma/client";
import {
  FileText,
  CalendarDays,
  Wallet,
  Home,
  Landmark,
  BadgeHelp,
} from "lucide-react";

const tenantLeaseArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    leases: {
      where: {
        deletedAt: null,
      },
      orderBy: {
        startDate: "desc",
      },
      include: {
        unit: {
          include: {
            building: true,
            property: true,
          },
        },
        contractDocument: true,
        rentCharges: {
          orderBy: {
            dueDate: "desc",
          },
          take: 6,
        },
      },
    },
  },
});

type TenantLeaseResult = Prisma.TenantGetPayload<typeof tenantLeaseArgs>;

function formatMoney(value: Prisma.Decimal | number | null | undefined) {
  if (value == null) return "N/A";
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getLeaseStatusClasses(status: LeaseStatus) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "EXPIRED":
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
    case "TERMINATED":
    case "CANCELLED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
  }
}

function getChargeStatusClasses(status: ChargeStatus) {
  switch (status) {
    case "PAID":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "PARTIAL":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "OVERDUE":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "UNPAID":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "WAIVED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
  }
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 xl:px-8">
        {children}
      </div>
    </div>
  );
}

function SurfaceCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[28px] border border-black/5 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] ${className}`}
    >
      {children}
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[24px] border border-black/5 bg-[#fafafa] p-4">
      <div className="flex items-center gap-2 text-neutral-500">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
          {icon}
        </div>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em]">
          {label}
        </p>
      </div>
      <p className="mt-3 text-[15px] font-semibold text-neutral-950">{value}</p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[18px] bg-white px-4 py-3">
      <dt className="text-sm text-neutral-500">{label}</dt>
      <dd className="text-right text-sm font-semibold text-neutral-950">
        {value}
      </dd>
    </div>
  );
}

export default async function TenantLeasePage() {
  const session = await requireTenantAccess();

  if (!session.userId) {
    throw new Error("Missing user id in session");
  }

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const tenant: TenantLeaseResult | null = await prisma.tenant.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId,
      deletedAt: null,
    },
    ...tenantLeaseArgs,
  });

  const latestLease = tenant?.leases?.[0] ?? null;

  return (
    <PageShell>
      {!tenant || tenant.leases.length === 0 ? (
        <SurfaceCard className="p-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-950">
            My Lease
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            No lease records found for your account.
          </p>
        </SurfaceCard>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <SurfaceCard className="p-5 sm:p-6 lg:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                  Lease Overview
                </p>
                <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-neutral-950 sm:text-[32px]">
                  My Lease
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                  View your tenancy details, contract information, and recent rent
                  charges.
                </p>
              </div>

              {latestLease ? (
                <div className="rounded-[24px] bg-[#f7f7fa] px-4 py-4 sm:px-5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                    Current Unit
                  </p>
                  <p className="mt-1 text-base font-semibold text-neutral-950">
                    {latestLease.unit.property.name} — {latestLease.unit.houseNo}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {latestLease.unit.building?.name ?? "No building"} •{" "}
                    {latestLease.status}
                  </p>
                </div>
              ) : null}
            </div>
          </SurfaceCard>

          {latestLease ? (
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:gap-4">
              <StatCard
                icon={<Wallet className="h-4 w-4" />}
                label="Monthly Rent"
                value={formatMoney(latestLease.monthlyRent)}
              />
              <StatCard
                icon={<Home className="h-4 w-4" />}
                label="Deposit"
                value={formatMoney(latestLease.deposit)}
              />
              <StatCard
                icon={<CalendarDays className="h-4 w-4" />}
                label="Start Date"
                value={formatDate(latestLease.startDate)}
              />
              <StatCard
                icon={<Landmark className="h-4 w-4" />}
                label="Due Day"
                value={`Day ${latestLease.dueDay}`}
              />
            </section>
          ) : null}

          <div className="space-y-5 lg:space-y-6">
            {tenant.leases.map((lease) => {
              const outstandingBalance = lease.rentCharges.reduce(
                (sum, charge) => sum + Number(charge.balance),
                0
              );

              return (
                <SurfaceCard key={lease.id} className="p-4 sm:p-6 xl:p-7">
                  <div className="space-y-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-[22px] font-semibold tracking-tight text-neutral-950">
                            {lease.unit.property.name}
                          </h2>
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${getLeaseStatusClasses(
                              lease.status
                            )}`}
                          >
                            {lease.status}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-neutral-500">
                          Unit {lease.unit.houseNo}
                          {lease.unit.building?.name
                            ? ` • ${lease.unit.building.name}`
                            : ""}
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row xl:flex-col xl:items-end">
                        <div className="rounded-[22px] bg-[#f7f7fa] px-4 py-3">
                          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                            Outstanding
                          </p>
                          <p className="mt-1 text-base font-semibold text-neutral-950">
                            {formatMoney(outstandingBalance)}
                          </p>
                        </div>

                        {lease.contractDocument ? (
                          <Link
                            href={`/tenant/documents/${lease.contractDocument.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-black/10 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition active:scale-[0.98]"
                          >
                            <FileText className="h-4 w-4" />
                            View Contract
                          </Link>
                        ) : (
                          <span className="inline-flex items-center justify-center rounded-[18px] border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-400">
                            No contract uploaded
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                      <StatCard
                        icon={<CalendarDays className="h-4 w-4" />}
                        label="Start"
                        value={formatDate(lease.startDate)}
                      />
                      <StatCard
                        icon={<CalendarDays className="h-4 w-4" />}
                        label="End"
                        value={
                          lease.endDate ? formatDate(lease.endDate) : "Open-ended"
                        }
                      />
                      <StatCard
                        icon={<Wallet className="h-4 w-4" />}
                        label="Rent"
                        value={formatMoney(lease.monthlyRent)}
                      />
                      <StatCard
                        icon={<Home className="h-4 w-4" />}
                        label="Deposit"
                        value={formatMoney(lease.deposit)}
                      />
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr] 2xl:grid-cols-[0.8fr_1.2fr]">
                      <div className="space-y-4">
                        <div className="rounded-[24px] bg-[#f8f8fb] p-4 sm:p-5">
                          <h3 className="text-[17px] font-semibold tracking-tight text-neutral-950">
                            Lease Details
                          </h3>
                          <dl className="mt-4 space-y-3">
                            <DetailRow
                              label="Property"
                              value={lease.unit.property.name}
                            />
                            <DetailRow
                              label="Building"
                              value={lease.unit.building?.name ?? "N/A"}
                            />
                            <DetailRow label="Unit" value={lease.unit.houseNo} />
                            <DetailRow
                              label="Due Day"
                              value={`Day ${lease.dueDay}`}
                            />
                            <DetailRow
                              label="Deposit"
                              value={formatMoney(lease.deposit)}
                            />
                          </dl>
                        </div>

                        <div className="rounded-[24px] bg-[#f8f8fb] p-4 sm:p-5">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                              <BadgeHelp className="h-4 w-4 text-neutral-600" />
                            </div>
                            <div>
                              <h3 className="text-[17px] font-semibold tracking-tight text-neutral-950">
                                Support
                              </h3>
                              <p className="mt-2 text-sm leading-6 text-neutral-500">
                                Contact management if your lease details, balance,
                                or contract information needs correction.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[24px] bg-[#f8f8fb] p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-[17px] font-semibold tracking-tight text-neutral-950">
                            Recent Charges
                          </h3>
                          <span className="text-xs font-medium text-neutral-500">
                            {lease.rentCharges.length} items
                          </span>
                        </div>

                        {lease.rentCharges.length > 0 ? (
                          <>
                            <div className="mt-4 space-y-3 xl:hidden">
                              {lease.rentCharges.map((charge) => (
                                <div
                                  key={charge.id}
                                  className="rounded-[20px] bg-white p-4"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold text-neutral-950">
                                        {charge.period}
                                      </p>
                                      <p className="mt-1 text-xs text-neutral-500">
                                        Due {formatDate(charge.dueDate)}
                                      </p>
                                    </div>

                                    <span
                                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getChargeStatusClasses(
                                        charge.status
                                      )}`}
                                    >
                                      {charge.status}
                                    </span>
                                  </div>

                                  <div className="mt-4 grid grid-cols-2 gap-3">
                                    <div className="rounded-[16px] bg-[#f8f8fb] px-3 py-3">
                                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                                        Amount Due
                                      </p>
                                      <p className="mt-1 text-sm font-semibold text-neutral-950">
                                        {formatMoney(charge.amountDue)}
                                      </p>
                                    </div>

                                    <div className="rounded-[16px] bg-[#f8f8fb] px-3 py-3">
                                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                                        Balance
                                      </p>
                                      <p className="mt-1 text-sm font-semibold text-neutral-950">
                                        {formatMoney(charge.balance)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="mt-4 hidden xl:block overflow-hidden rounded-[20px] bg-white">
                              <table className="min-w-full text-sm">
                                <thead className="border-b border-neutral-200 bg-[#fcfcfd]">
                                  <tr className="text-left text-neutral-500">
                                    <th className="px-5 py-4 font-medium">Period</th>
                                    <th className="px-5 py-4 font-medium">Due Date</th>
                                    <th className="px-5 py-4 font-medium">Amount Due</th>
                                    <th className="px-5 py-4 font-medium">Balance</th>
                                    <th className="px-5 py-4 font-medium">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {lease.rentCharges.map((charge) => (
                                    <tr
                                      key={charge.id}
                                      className="border-b border-neutral-100 last:border-0"
                                    >
                                      <td className="px-5 py-4 font-medium text-neutral-950">
                                        {charge.period}
                                      </td>
                                      <td className="px-5 py-4 text-neutral-600">
                                        {formatDate(charge.dueDate)}
                                      </td>
                                      <td className="px-5 py-4 text-neutral-600">
                                        {formatMoney(charge.amountDue)}
                                      </td>
                                      <td className="px-5 py-4 text-neutral-600">
                                        {formatMoney(charge.balance)}
                                      </td>
                                      <td className="px-5 py-4">
                                        <span
                                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getChargeStatusClasses(
                                            charge.status
                                          )}`}
                                        >
                                          {charge.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        ) : (
                          <div className="mt-4 rounded-[20px] bg-white p-4 text-sm text-neutral-500">
                            No recent rent charges found for this lease.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </SurfaceCard>
              );
            })}
          </div>
        </div>
      )}
    </PageShell>
  );
}