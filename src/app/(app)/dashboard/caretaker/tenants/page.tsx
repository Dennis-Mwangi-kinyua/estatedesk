import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Ban,
  FileText,
  Home,
  Mail,
  Phone,
  UserRound,
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
    case "BLACKLISTED":
      return "border-red-200 bg-red-50 text-red-700";
    case "INACTIVE":
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function contactHref(kind: "phone" | "sms" | "email", value: string | null) {
  if (!value) return null;

  if (kind === "email") {
    return `mailto:${value}`;
  }

  if (kind === "sms") {
    return `sms:${value}`;
  }

  return `tel:${value}`;
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

export default async function TenantsPage() {
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

  const tenants =
    allowedUnitIds.length === 0
      ? []
      : await prisma.tenant.findMany({
          where: {
            orgId,
            deletedAt: null,

            /*
             * Important access-control filter:
             * Only show tenants who have a lease connected to one of the
             * caretaker's assigned apartments/units.
             */
            leases: {
              some: {
                deletedAt: null,
                unitId: {
                  in: allowedUnitIds,
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          include: {
            leases: {
              where: {
                deletedAt: null,
                unitId: {
                  in: allowedUnitIds,
                },
              },
              orderBy: [{ status: "asc" }, { createdAt: "desc" }],
              include: {
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
            },
          },
        });

  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(
    (tenant) => tenant.status === "ACTIVE",
  ).length;
  const inactiveTenants = tenants.filter(
    (tenant) => tenant.status === "INACTIVE",
  ).length;
  const blacklistedTenants = tenants.filter(
    (tenant) => tenant.status === "BLACKLISTED",
  ).length;

  return (
    <div className="space-y-5 pb-5 sm:space-y-6">
      <section className="ios-panel overflow-hidden rounded-[28px] p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                <Users className="h-[18px] w-[18px]" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Caretaker
              </p>
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              My Tenants
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
              Tenant records for apartments and units under your care.
            </p>
          </div>

          <Link
            href="/dashboard/caretaker/leases"
            aria-label="View leases"
            className="ios-button inline-flex h-11 w-11 shrink-0 items-center justify-center border border-neutral-200 bg-white/88 text-neutral-800 shadow-sm hover:bg-white"
          >
            <FileText className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <section className="ios-scroll -mx-3 flex gap-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
        <StatPill label="Total" value={totalTenants} icon={Users} />
        <StatPill label="Active" value={activeTenants} icon={BadgeCheck} />
        <StatPill label="Inactive" value={inactiveTenants} icon={UserRound} />
        <StatPill label="Flagged" value={blacklistedTenants} icon={Ban} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Assigned tenants
          </h2>
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-neutral-600 ring-1 ring-neutral-200">
            {totalTenants}
          </span>
        </div>

        {tenants.length === 0 ? (
          <div className="ios-card rounded-[26px] p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
              <Users className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-semibold text-neutral-950">
              No tenants found
            </p>
            <p className="mt-1 text-sm leading-6 text-neutral-500">
              No tenant lease is linked to your assigned apartment yet.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {tenants.map((tenant) => {
                const currentLease =
                  tenant.leases.find((lease) => lease.status === "ACTIVE") ??
                  tenant.leases[0];
                const rent =
                  currentLease?.monthlyRent != null
                    ? formatCurrency(currentLease.monthlyRent)
                    : currentLease?.unit?.rentAmount != null
                      ? formatCurrency(currentLease.unit.rentAmount)
                      : "—";
                const phoneHref = contactHref("phone", tenant.phone);
                const smsHref = contactHref("sms", tenant.phone);
                const emailHref = contactHref("email", tenant.email);

                return (
                  <article
                    key={tenant.id}
                    className="ios-card rounded-[26px] p-4 active:scale-[0.995]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-neutral-950">
                          {tenant.fullName}
                        </p>
                        <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-neutral-500">
                          <Home className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {[
                              currentLease?.unit?.property?.name,
                              currentLease?.unit?.building?.name,
                              currentLease?.unit?.houseNo
                                ? `Unit ${currentLease.unit.houseNo}`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" / ") || "No unit"}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                          tenant.status,
                        )}`}
                      >
                        {tenant.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-neutral-50 p-3 ring-1 ring-neutral-200/70">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
                          <Phone className="h-3.5 w-3.5" />
                          Phone
                        </div>
                        <p className="mt-1 truncate text-sm font-semibold text-neutral-950">
                          {tenant.phone}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-neutral-50 p-3 ring-1 ring-neutral-200/70">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
                          <FileText className="h-3.5 w-3.5" />
                          Rent
                        </div>
                        <p className="mt-1 truncate text-sm font-semibold text-neutral-950">
                          {rent}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-3 py-2.5 ring-1 ring-neutral-200/70">
                      <div className="flex min-w-0 items-center gap-2 text-xs text-neutral-500">
                        <Mail className="h-4 w-4 shrink-0" />
                        <span className="truncate">{tenant.email ?? "No email"}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-neutral-400" />
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <a
                        href={phoneHref ?? undefined}
                        aria-disabled={!phoneHref}
                        className={`ios-button inline-flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-xs font-semibold ${
                          phoneHref
                            ? "bg-neutral-950 text-white"
                            : "pointer-events-none bg-neutral-100 text-neutral-400"
                        }`}
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Call
                      </a>
                      <a
                        href={smsHref ?? undefined}
                        aria-disabled={!smsHref}
                        className={`ios-button inline-flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-xs font-semibold ${
                          smsHref
                            ? "bg-white text-neutral-800 ring-1 ring-neutral-200"
                            : "pointer-events-none bg-neutral-100 text-neutral-400"
                        }`}
                      >
                        SMS
                      </a>
                      <a
                        href={emailHref ?? undefined}
                        aria-disabled={!emailHref}
                        className={`ios-button inline-flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-xs font-semibold ${
                          emailHref
                            ? "bg-white text-neutral-800 ring-1 ring-neutral-200"
                            : "pointer-events-none bg-neutral-100 text-neutral-400"
                        }`}
                      >
                        <Mail className="h-3.5 w-3.5" />
                        Email
                      </a>
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
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Current Property</th>
                  <th className="px-4 py-3 font-medium">Building</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Monthly Rent</th>
                  <th className="px-4 py-3 font-medium">Lease Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>

              <tbody>
                {tenants.map((tenant) => {
                  const currentLease =
                    tenant.leases.find((lease) => lease.status === "ACTIVE") ??
                    tenant.leases[0];

                  return (
                    <tr key={tenant.id} className="border-t">
                      <td className="px-4 py-3 font-medium">
                        {tenant.fullName}
                      </td>

                      <td className="px-4 py-3">{tenant.phone}</td>

                      <td className="px-4 py-3">{tenant.email ?? "—"}</td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${statusClasses(
                            tenant.status,
                          )}`}
                        >
                          {tenant.status}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {currentLease?.unit?.property ? (
                          <Link
                            href={`/properties/${currentLease.unit.property.id}`}
                            className="underline underline-offset-4"
                          >
                            {currentLease.unit.property.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {currentLease?.unit?.building?.name ?? "—"}
                      </td>

                      <td className="px-4 py-3">
                        {currentLease?.unit?.houseNo ?? "—"}
                      </td>

                      <td className="px-4 py-3">
                        {currentLease?.monthlyRent != null
                          ? formatCurrency(currentLease.monthlyRent)
                          : currentLease?.unit?.rentAmount != null
                            ? formatCurrency(currentLease.unit.rentAmount)
                            : "—"}
                      </td>

                      <td className="px-4 py-3">
                        {currentLease ? currentLease.status : "NO_LEASE"}
                      </td>

                      <td className="px-4 py-3">
                        {formatDate(tenant.createdAt)}
                      </td>
                    </tr>
                  );
                })}
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
