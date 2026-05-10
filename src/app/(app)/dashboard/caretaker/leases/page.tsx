import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Home,
  Phone,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { getCaretakerAllowedUnitIds } from "@/lib/caretaker/access";

export const dynamic = "force-dynamic";

function formatCurrency(value: unknown) {
  const amount =
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
      ? (value as { toNumber: () => number }).toNumber()
      : Number(value ?? 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function statusClasses(status: string) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "EXPIRED":
    case "TERMINATED":
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function phoneHref(value: string | null | undefined) {
  return value ? `tel:${value}` : null;
}

function StatPill({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="ios-card min-w-[9.25rem] rounded-[22px] p-4 sm:min-w-0">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">
            {value}
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-white">
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
    </div>
  );
}

export default async function LeasesPage() {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    redirect("/login");
  }

  if (session.activeOrgRole !== "CARETAKER") {
    redirect("/dashboard");
  }

  const orgId = session.activeOrgId;
  const caretakerUserId = session.userId;

  const allowedUnitIds = await getCaretakerAllowedUnitIds({
    orgId,
    caretakerUserId,
    membershipScope: session.membershipScope,
  });

  const leases =
    allowedUnitIds.length === 0
      ? []
      : await prisma.lease.findMany({
          where: {
            orgId,
            deletedAt: null,
            unitId: {
              in: allowedUnitIds,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          include: {
            tenant: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
                status: true,
              },
            },
            unit: {
              select: {
                id: true,
                houseNo: true,
                rentAmount: true,
                status: true,
                property: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                building: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

  const totalLeases = leases.length;
  const activeLeases = leases.filter((lease) => lease.status === "ACTIVE").length;
  const nonActiveLeases = totalLeases - activeLeases;

  return (
    <div className="space-y-5 pb-5 sm:space-y-6">
      <section className="ios-panel overflow-hidden rounded-[28px] p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                <FileText className="h-[18px] w-[18px]" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Caretaker
              </p>
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              My Leases
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
              Leases connected to the apartments and units assigned to you.
            </p>
          </div>

          <Link
            href="/dashboard/caretaker/tenants"
            aria-label="View tenants"
            className="ios-button inline-flex h-11 w-11 shrink-0 items-center justify-center border border-neutral-200 bg-white/88 text-neutral-800 shadow-sm hover:bg-white"
          >
            <Users className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <section className="ios-scroll -mx-3 flex gap-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
        <StatPill label="Total" value={totalLeases} icon={FileText} />
        <StatPill label="Active" value={activeLeases} icon={CheckCircle2} />
        <StatPill label="Other" value={nonActiveLeases} icon={Clock3} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Assigned leases
          </h2>
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-neutral-600 ring-1 ring-neutral-200">
            {totalLeases}
          </span>
        </div>

        {leases.length === 0 ? (
          <div className="ios-card rounded-[26px] p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
              <Home className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-semibold text-neutral-950">
              No leases found
            </p>
            <p className="mt-1 text-sm leading-6 text-neutral-500">
              Nothing is linked to your assigned apartment yet.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {leases.map((lease) => {
                const rent =
                  lease.monthlyRent != null
                    ? formatCurrency(lease.monthlyRent)
                    : lease.unit?.rentAmount != null
                      ? formatCurrency(lease.unit.rentAmount)
                      : "—";
                const tenantPhoneHref = phoneHref(lease.tenant?.phone);

                return (
                  <article
                    key={lease.id}
                    className="ios-card rounded-[26px] p-4 active:scale-[0.995]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-neutral-950">
                          {lease.tenant?.fullName ?? "Unassigned tenant"}
                        </p>
                        <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-neutral-500">
                          <Home className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {[
                              lease.unit?.property?.name,
                              lease.unit?.building?.name,
                              lease.unit?.houseNo
                                ? `Unit ${lease.unit.houseNo}`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" / ") || "No unit"}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                          lease.status,
                        )}`}
                      >
                        {lease.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-neutral-50 p-3 ring-1 ring-neutral-200/70">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
                          <Banknote className="h-3.5 w-3.5" />
                          Rent
                        </div>
                        <p className="mt-1 truncate text-sm font-semibold text-neutral-950">
                          {rent}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-neutral-50 p-3 ring-1 ring-neutral-200/70">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
                          <Phone className="h-3.5 w-3.5" />
                          Phone
                        </div>
                        <p className="mt-1 truncate text-sm font-semibold text-neutral-950">
                          {lease.tenant?.phone ?? "—"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-3 py-2.5 ring-1 ring-neutral-200/70">
                      <div className="flex min-w-0 items-center gap-2 text-xs text-neutral-500">
                        <CalendarDays className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-neutral-400" />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <a
                        href={tenantPhoneHref ?? undefined}
                        aria-disabled={!tenantPhoneHref}
                        className={`ios-button inline-flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-xs font-semibold ${
                          tenantPhoneHref
                            ? "bg-neutral-950 text-white"
                            : "pointer-events-none bg-neutral-100 text-neutral-400"
                        }`}
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Call tenant
                      </a>
                      <Link
                        href="/dashboard/caretaker/tenants"
                        className="ios-button inline-flex items-center justify-center gap-1.5 rounded-2xl bg-white px-3 py-2.5 text-xs font-semibold text-neutral-800 ring-1 ring-neutral-200"
                      >
                        <Users className="h-3.5 w-3.5" />
                        Tenant list
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-hidden rounded-[24px] border border-neutral-200/80 bg-white/88 shadow-sm md:block">
              <div className="ios-scroll overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Building</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Lease Status</th>
                  <th className="px-4 py-3 font-medium">Monthly Rent</th>
                  <th className="px-4 py-3 font-medium">Start</th>
                  <th className="px-4 py-3 font-medium">End</th>
                </tr>
              </thead>

              <tbody>
                {leases.map((lease) => (
                  <tr key={lease.id} className="border-t">
                    <td className="px-4 py-3 font-medium">
                      {lease.tenant?.fullName ?? "—"}
                    </td>

                    <td className="px-4 py-3">
                      {lease.tenant?.phone ?? "—"}
                    </td>

                    <td className="px-4 py-3">
                      {lease.unit?.property ? (
                        <Link
                          href={`/properties/${lease.unit.property.id}`}
                          className="underline underline-offset-4"
                        >
                          {lease.unit.property.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {lease.unit?.building?.name ?? "—"}
                    </td>

                    <td className="px-4 py-3">
                      {lease.unit?.houseNo ?? "—"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${statusClasses(
                          lease.status,
                        )}`}
                      >
                        {lease.status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {lease.monthlyRent != null
                        ? formatCurrency(lease.monthlyRent)
                        : lease.unit?.rentAmount != null
                          ? formatCurrency(lease.unit.rentAmount)
                          : "—"}
                    </td>

                    <td className="px-4 py-3">
                      {formatDate(lease.startDate)}
                    </td>

                    <td className="px-4 py-3">
                      {formatDate(lease.endDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
