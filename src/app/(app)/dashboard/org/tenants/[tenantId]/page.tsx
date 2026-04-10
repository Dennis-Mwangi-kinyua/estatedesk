import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import {
  archiveTenant,
  blacklistTenant,
  restoreTenant,
  softDeleteTenant,
  unlinkTenantFromUnit,
} from "./actions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    tenantId: string;
  }>;
};

function formatStatus(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function getStatusClasses(status: string) {
  const normalized = String(status).toUpperCase();

  switch (normalized) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "INACTIVE":
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
    case "BLACKLISTED":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function formatCurrency(amount: unknown) {
  if (amount == null) return "—";

  const value =
    typeof amount === "object" && amount !== null && "toNumber" in amount
      ? (amount as { toNumber(): number }).toNumber()
      : Number(amount);

  if (Number.isNaN(value)) return "—";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(value);
}

function getLeaseUnitLabel(lease: {
  unit: {
    houseNo: string;
    building: { name: string | null } | null;
    property: { name: string } | null;
  };
}) {
  return [lease.unit.property?.name, lease.unit.building?.name, `Unit ${lease.unit.houseNo}`]
    .filter(Boolean)
    .join(" / ");
}

export default async function TenantDetailsPage({ params }: PageProps) {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        No active organisation found for your account.
      </div>
    );
  }

  if (
    !session.activeOrgRole ||
    !["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"].includes(session.activeOrgRole)
  ) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        You do not have permission to view tenant details.
      </div>
    );
  }

  const { tenantId } = await params;
  const orgId = String(session.activeOrgId).trim();

  if (!tenantId?.trim()) {
    notFound();
  }

  let tenant:
    | {
        id: string;
        fullName: string;
        email: string | null;
        phone: string;
        status: string;
        nationalId: string | null;
        companyName: string | null;
        kraPin: string | null;
        notes: string | null;
        createdAt: Date;
        deletedAt: Date | null;
        archivedAt: Date | null;
        blacklistedAt: Date | null;
        blacklistReason: string | null;
        leases: Array<{
          id: string;
          startDate: Date;
          endDate: Date | null;
          monthlyRent: unknown;
          deposit: unknown;
          status: string;
          notes: string | null;
          unitId: string;
          unit: {
            houseNo: string;
            building: { name: string | null } | null;
            property: { name: string } | null;
          };
        }>;
        actionLogs: Array<{
          id: string;
          action: string;
          reason: string | null;
          notes: string | null;
          createdAt: Date;
          actor: {
            fullName: string;
            email: string | null;
          };
        }>;
      }
    | null = null;

  try {
    tenant = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
        orgId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        nationalId: true,
        companyName: true,
        kraPin: true,
        notes: true,
        createdAt: true,
        deletedAt: true,
        archivedAt: true,
        blacklistedAt: true,
        blacklistReason: true,
        leases: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            monthlyRent: true,
            deposit: true,
            status: true,
            notes: true,
            unitId: true,
            unit: {
              select: {
                houseNo: true,
                building: {
                  select: { name: true },
                },
                property: {
                  select: { name: true },
                },
              },
            },
          },
        },
        actionLogs: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
          select: {
            id: true,
            action: true,
            reason: true,
            notes: true,
            createdAt: true,
            actor: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Failed to load tenant:", error);

    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Failed to load tenant details.
      </div>
    );
  }

  if (!tenant) {
    notFound();
  }

  const activeLease =
    tenant.leases.find((lease) => String(lease.status).toUpperCase() === "ACTIVE") ??
    tenant.leases[0] ??
    null;

  const canManage = ["ADMIN", "MANAGER", "OFFICE"].includes(String(session.activeOrgRole));
  const isDeleted = Boolean(tenant.deletedAt);
  const isBlacklisted = String(tenant.status).toUpperCase() === "BLACKLISTED";
  const isArchived = String(tenant.status).toUpperCase() === "INACTIVE";

  return (
    <div className="min-h-screen bg-[#f5f5f7] px-3 pb-6 pt-3 sm:px-4 sm:pt-4">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="rounded-[28px] border border-black/5 bg-white/90 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <Link
                  href="/dashboard/org/tenants"
                  className="mb-2 inline-flex text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
                >
                  ← Back to tenants
                </Link>

                <h1 className="truncate text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
                  {tenant.fullName}
                </h1>

                <p className="mt-1 text-sm text-neutral-600">
                  Tenant profile, lease information, and action history
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${getStatusClasses(
                    tenant.status,
                  )}`}
                >
                  {formatStatus(tenant.status)}
                </span>

                {isDeleted ? (
                  <span className="inline-flex shrink-0 rounded-full border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                    Deleted
                  </span>
                ) : null}
              </div>
            </div>

            {canManage ? (
              <div className="grid gap-3 rounded-3xl bg-[#f7f7f8] p-4">
                <h2 className="text-sm font-semibold text-neutral-900">Tenant actions</h2>

                <div className="grid gap-3 md:grid-cols-2">
                  {!isDeleted && activeLease ? (
                    <form action={unlinkTenantFromUnit} className="rounded-2xl border border-black/5 bg-white p-3">
                      <input type="hidden" name="tenantId" value={tenant.id} />
                      <label className="block text-xs font-medium uppercase tracking-wide text-neutral-400">
                        Unlink from unit reason
                      </label>
                      <textarea
                        name="reason"
                        rows={2}
                        placeholder="Optional reason for unlinking tenant from current unit"
                        className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400"
                      />
                      <button
                        type="submit"
                        className="mt-3 inline-flex rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-100"
                      >
                        Unlink from unit
                      </button>
                    </form>
                  ) : null}

                  {!isDeleted && !isBlacklisted ? (
                    <form action={blacklistTenant} className="rounded-2xl border border-black/5 bg-white p-3">
                      <input type="hidden" name="tenantId" value={tenant.id} />
                      <label className="block text-xs font-medium uppercase tracking-wide text-neutral-400">
                        Blacklist reason
                      </label>
                      <textarea
                        name="reason"
                        rows={2}
                        placeholder="Reason for blacklisting this tenant"
                        className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400"
                      />
                      <button
                        type="submit"
                        className="mt-3 inline-flex rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                      >
                        Blacklist tenant
                      </button>
                    </form>
                  ) : null}

                  {!isDeleted && !isArchived ? (
                    <form action={archiveTenant} className="rounded-2xl border border-black/5 bg-white p-3">
                      <input type="hidden" name="tenantId" value={tenant.id} />
                      <label className="block text-xs font-medium uppercase tracking-wide text-neutral-400">
                        Archive reason
                      </label>
                      <textarea
                        name="reason"
                        rows={2}
                        placeholder="Optional reason for archiving this tenant"
                        className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400"
                      />
                      <button
                        type="submit"
                        className="mt-3 inline-flex rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-200"
                      >
                        Archive tenant
                      </button>
                    </form>
                  ) : null}

                  {!isDeleted ? (
                    <form action={softDeleteTenant} className="rounded-2xl border border-black/5 bg-white p-3">
                      <input type="hidden" name="tenantId" value={tenant.id} />
                      <label className="block text-xs font-medium uppercase tracking-wide text-neutral-400">
                        Delete reason
                      </label>
                      <textarea
                        name="reason"
                        rows={2}
                        placeholder="Why are you deleting this tenant?"
                        className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400"
                      />
                      <p className="mt-2 text-xs text-neutral-500">
                        Tenant must not have an active lease before deletion.
                      </p>
                      <button
                        type="submit"
                        className="mt-3 inline-flex rounded-xl border border-red-300 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                      >
                        Soft delete tenant
                      </button>
                    </form>
                  ) : (
                    <form action={restoreTenant} className="rounded-2xl border border-black/5 bg-white p-3">
                      <input type="hidden" name="tenantId" value={tenant.id} />
                      <label className="block text-xs font-medium uppercase tracking-wide text-neutral-400">
                        Restore reason
                      </label>
                      <textarea
                        name="reason"
                        rows={2}
                        placeholder="Optional reason for restoring this tenant"
                        className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400"
                      />
                      <button
                        type="submit"
                        className="mt-3 inline-flex rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Restore tenant
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <section className="rounded-[28px] border border-black/5 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
              <h2 className="text-base font-semibold text-neutral-950">Contact details</h2>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-[#f7f7f8] p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Full name</p>
                  <p className="mt-1 text-sm text-neutral-900">{tenant.fullName}</p>
                </div>

                <div className="rounded-2xl bg-[#f7f7f8] p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Phone</p>
                  <p className="mt-1 text-sm text-neutral-900">{tenant.phone || "—"}</p>
                </div>

                <div className="rounded-2xl bg-[#f7f7f8] p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Email</p>
                  <p className="mt-1 break-all text-sm text-neutral-900">{tenant.email || "—"}</p>
                </div>

                <div className="rounded-2xl bg-[#f7f7f8] p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">National ID</p>
                  <p className="mt-1 text-sm text-neutral-900">{tenant.nationalId || "—"}</p>
                </div>

                <div className="rounded-2xl bg-[#f7f7f8] p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">KRA PIN</p>
                  <p className="mt-1 text-sm text-neutral-900">{tenant.kraPin || "—"}</p>
                </div>

                <div className="rounded-2xl bg-[#f7f7f8] p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Company</p>
                  <p className="mt-1 text-sm text-neutral-900">{tenant.companyName || "—"}</p>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-black/5 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
              <h2 className="text-base font-semibold text-neutral-950">Notes</h2>

              <div className="mt-4 rounded-2xl bg-[#f7f7f8] p-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-neutral-700">
                  {tenant.notes || "No notes available."}
                </p>
              </div>
            </section>

            <section className="rounded-[28px] border border-black/5 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
              <h2 className="text-base font-semibold text-neutral-950">Recent tenant actions</h2>

              <div className="mt-4 space-y-3">
                {tenant.actionLogs.length === 0 ? (
                  <div className="rounded-2xl bg-[#f7f7f8] p-4 text-sm text-neutral-600">
                    No tenant actions recorded yet.
                  </div>
                ) : (
                  tenant.actionLogs.map((log) => (
                    <div key={log.id} className="rounded-2xl bg-[#f7f7f8] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-neutral-950">{formatStatus(log.action)}</p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {formatDate(log.createdAt)} • {log.actor.fullName}
                          </p>
                        </div>
                      </div>

                      {log.reason ? (
                        <p className="mt-3 text-sm text-neutral-700">
                          <span className="font-medium text-neutral-900">Reason:</span> {log.reason}
                        </p>
                      ) : null}

                      {log.notes ? (
                        <p className="mt-2 text-sm text-neutral-700">
                          <span className="font-medium text-neutral-900">Notes:</span> {log.notes}
                        </p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <section className="rounded-[28px] border border-black/5 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
              <h2 className="text-base font-semibold text-neutral-950">Summary</h2>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-[#f7f7f8] p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Current unit</p>
                  <p className="mt-1 text-sm text-neutral-900">
                    {activeLease && String(activeLease.status).toUpperCase() === "ACTIVE"
                      ? getLeaseUnitLabel(activeLease)
                      : "Not assigned"}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f7f7f8] p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Monthly rent</p>
                  <p className="mt-1 text-sm text-neutral-900">
                    {activeLease && String(activeLease.status).toUpperCase() === "ACTIVE"
                      ? formatCurrency(activeLease.monthlyRent)
                      : "—"}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f7f7f8] p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Deposit</p>
                  <p className="mt-1 text-sm text-neutral-900">
                    {activeLease && String(activeLease.status).toUpperCase() === "ACTIVE"
                      ? formatCurrency(activeLease.deposit)
                      : "—"}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f7f7f8] p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Lease start</p>
                  <p className="mt-1 text-sm text-neutral-900">
                    {activeLease && String(activeLease.status).toUpperCase() === "ACTIVE"
                      ? formatDate(activeLease.startDate)
                      : "—"}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f7f7f8] p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Lease end</p>
                  <p className="mt-1 text-sm text-neutral-900">
                    {activeLease && String(activeLease.status).toUpperCase() === "ACTIVE"
                      ? formatDate(activeLease.endDate)
                      : "—"}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f7f7f8] p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Tenant since</p>
                  <p className="mt-1 text-sm text-neutral-900">{formatDate(tenant.createdAt)}</p>
                </div>

                <div className="rounded-2xl bg-[#f7f7f8] p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Archived at</p>
                  <p className="mt-1 text-sm text-neutral-900">{formatDate(tenant.archivedAt)}</p>
                </div>

                <div className="rounded-2xl bg-[#f7f7f8] p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Blacklisted at</p>
                  <p className="mt-1 text-sm text-neutral-900">{formatDate(tenant.blacklistedAt)}</p>
                </div>

                <div className="rounded-2xl bg-[#f7f7f8] p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Blacklist reason</p>
                  <p className="mt-1 text-sm text-neutral-900">{tenant.blacklistReason || "—"}</p>
                </div>

                <div className="rounded-2xl bg-[#f7f7f8] p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Deleted at</p>
                  <p className="mt-1 text-sm text-neutral-900">{formatDate(tenant.deletedAt)}</p>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-black/5 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
              <h2 className="text-base font-semibold text-neutral-950">Lease history</h2>

              <div className="mt-4 space-y-3">
                {tenant.leases.length === 0 ? (
                  <div className="rounded-2xl bg-[#f7f7f8] p-4 text-sm text-neutral-600">
                    No lease records found.
                  </div>
                ) : (
                  tenant.leases.map((lease) => (
                    <div key={lease.id} className="rounded-2xl bg-[#f7f7f8] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-neutral-950">{getLeaseUnitLabel(lease)}</p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
                          </p>
                        </div>

                        <span
                          className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                            lease.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
                          )}`}
                        >
                          {formatStatus(lease.status)}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-neutral-400">Rent</p>
                          <p className="mt-1 text-neutral-800">{formatCurrency(lease.monthlyRent)}</p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-neutral-400">Deposit</p>
                          <p className="mt-1 text-neutral-800">{formatCurrency(lease.deposit)}</p>
                        </div>
                      </div>

                      {lease.notes ? (
                        <div className="mt-3">
                          <p className="text-xs uppercase tracking-wide text-neutral-400">Notes</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{lease.notes}</p>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}