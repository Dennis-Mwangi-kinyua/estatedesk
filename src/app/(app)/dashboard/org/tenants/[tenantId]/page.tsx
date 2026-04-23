import Link from "next/link";
import { notFound } from "next/navigation";
import { memo } from "react";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { TenantAdminActions } from "./TenantAdminActions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    tenantId: string;
  }>;
};

type DecimalLike = {
  toNumber(): number;
};

function formatStatus(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function getStatusClasses(status: string) {
  const normalized = String(status).toUpperCase();

  switch (normalized) {
    case "ACTIVE":
    case "PAID_VERIFIED":
    case "VERIFIED":
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "PENDING":
    case "PARTIAL":
    case "PAYMENT_PENDING":
    case "INSPECTION_SCHEDULED":
    case "SUBMITTED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "BLACKLISTED":
    case "FAILED":
    case "REJECTED":
    case "OVERDUE":
    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700";
    case "INACTIVE":
    case "EXPIRED":
    case "TERMINATED":
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
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

function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function toNumberValue(amount: unknown) {
  if (amount == null) return null;

  if (typeof amount === "object" && amount !== null && "toNumber" in amount) {
    return (amount as DecimalLike).toNumber();
  }

  const parsed = Number(amount);
  return Number.isNaN(parsed) ? null : parsed;
}

function formatCurrency(amount: unknown) {
  const value = toNumberValue(amount);
  if (value == null) return "—";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatBoolean(value: boolean | null | undefined) {
  if (value == null) return "—";
  return value ? "Yes" : "No";
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

function getUnitLabel(unit: {
  houseNo: string;
  building: { name: string | null } | null;
  property: { name: string } | null;
}) {
  return [unit.property?.name, unit.building?.name, `Unit ${unit.houseNo}`]
    .filter(Boolean)
    .join(" / ");
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const DetailItem = memo(function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
        {label}
      </p>
      <p className={`mt-2 break-words text-sm text-neutral-900 ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </p>
    </div>
  );
});

const SectionHeader = memo(function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
      <p className="mt-1 text-sm text-neutral-500">{description}</p>
    </div>
  );
});

const SummaryStat = memo(function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-neutral-900">{value}</p>
    </div>
  );
});

const TenantHeroCard = memo(function TenantHeroCard({
  fullName,
  status,
  type,
  email,
  phone,
  currentUnit,
  currentRent,
  canManage,
  initials,
  tenantId,
  hasActiveLease,
  isDeleted,
  isBlacklisted,
  isArchived,
}: {
  fullName: string;
  status: string;
  type: string;
  email: string | null;
  phone: string | null;
  currentUnit: string;
  currentRent: string;
  canManage: boolean;
  initials: string;
  tenantId: string;
  hasActiveLease: boolean;
  isDeleted: boolean;
  isBlacklisted: boolean;
  isArchived: boolean;
}) {
  return (
    <section className="rounded-[28px] border border-black/5 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 text-base font-semibold text-white">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <Link
            href="/dashboard/org/tenants"
            className="inline-flex text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
          >
            ← Back to tenants
          </Link>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="truncate text-lg font-semibold text-neutral-950 sm:text-2xl">
              {fullName}
            </h1>

            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                status,
              )}`}
            >
              {formatStatus(status)}
            </span>

            <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              {formatStatus(type)}
            </span>
          </div>

          <p className="mt-2 text-sm text-neutral-500">
            {email || "No email"} • {phone || "No phone"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SummaryStat label="Current unit" value={currentUnit} />
        <SummaryStat label="Monthly rent" value={currentRent} />
      </div>

      {canManage ? (
        <div className="mt-4">
          <TenantAdminActions
            tenantId={tenantId}
            hasActiveLease={hasActiveLease}
            isDeleted={isDeleted}
            isBlacklisted={isBlacklisted}
            isArchived={isArchived}
          />
        </div>
      ) : null}
    </section>
  );
});

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

  const tenant = await prisma.tenant.findFirst({
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
      type: true,
      nationalId: true,
      companyName: true,
      kraPin: true,
      notes: true,
      dataConsent: true,
      consentUpdatedAt: true,
      marketingConsent: true,
      createdAt: true,
      deletedAt: true,
      archivedAt: true,
      blacklistedAt: true,
      blacklistReason: true,
      profileImage: {
        select: {
          id: true,
          key: true,
          fileName: true,
        },
      },
      nextOfKin: {
        select: {
          name: true,
          relationship: true,
          phone: true,
          email: true,
        },
      },
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
          dueDay: true,
          monthlyRent: true,
          deposit: true,
          status: true,
          notes: true,
          unitId: true,
          caretaker: {
            select: {
              fullName: true,
              email: true,
            },
          },
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
        take: 20,
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
          lease: {
            select: {
              id: true,
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
      payments: {
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
        select: {
          id: true,
          method: true,
          amount: true,
          reference: true,
          targetType: true,
          gatewayStatus: true,
          verificationStatus: true,
          paidAt: true,
          createdAt: true,
        },
      },
      waterBills: {
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
        select: {
          id: true,
          period: true,
          unitsUsed: true,
          total: true,
          dueDate: true,
          status: true,
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
      moveOutNotices: {
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
        select: {
          id: true,
          noticeDate: true,
          moveOutDate: true,
          status: true,
          notes: true,
          lease: {
            select: {
              id: true,
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
          inspection: {
            select: {
              id: true,
              scheduledAt: true,
              status: true,
              completedAt: true,
              inspector: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!tenant) notFound();

  const activeLease =
    tenant.leases.find((lease) => String(lease.status).toUpperCase() === "ACTIVE") ??
    tenant.leases[0] ??
    null;

  const canManage = ["ADMIN", "MANAGER", "OFFICE"].includes(String(session.activeOrgRole));
  const isDeleted = Boolean(tenant.deletedAt);
  const isBlacklisted = String(tenant.status).toUpperCase() === "BLACKLISTED";
  const isArchived = String(tenant.status).toUpperCase() === "INACTIVE";
  const hasActiveLease = Boolean(activeLease && String(activeLease.status).toUpperCase() === "ACTIVE");

  const currentUnit = hasActiveLease ? getLeaseUnitLabel(activeLease!) : "Not assigned";
  const currentRent = hasActiveLease ? formatCurrency(activeLease!.monthlyRent) : "—";
  const currentDeposit = hasActiveLease ? formatCurrency(activeLease!.deposit) : "—";

  const totalPayments = tenant.payments.reduce((sum, payment) => {
    return sum + (toNumberValue(payment.amount) ?? 0);
  }, 0);

  const tenantHistory = [
    {
      id: `tenant-created-${tenant.id}`,
      kind: "Tenant",
      title: "Tenant profile created",
      date: tenant.createdAt,
      description: `Tenant was onboarded as ${formatStatus(tenant.type)} tenant.`,
      tag: "Created",
      tone: "default" as const,
    },
    ...tenant.leases.map((lease) => ({
      id: `lease-${lease.id}`,
      kind: "Lease",
      title: `${formatStatus(lease.status)} lease • ${getLeaseUnitLabel(lease)}`,
      date: lease.startDate,
      description: `Lease started ${formatDate(lease.startDate)}${lease.endDate ? ` and ends ${formatDate(lease.endDate)}` : ""}. Rent ${formatCurrency(lease.monthlyRent)}.`,
      tag: formatStatus(lease.status),
      tone: String(lease.status).toUpperCase() === "ACTIVE" ? ("success" as const) : ("default" as const),
    })),
    ...tenant.payments.map((payment) => ({
      id: `payment-${payment.id}`,
      kind: "Payment",
      title: `${formatStatus(payment.targetType)} payment • ${formatCurrency(payment.amount)}`,
      date: payment.paidAt ?? payment.createdAt,
      description: `${formatStatus(payment.method)} • ${formatStatus(payment.gatewayStatus)} / ${formatStatus(payment.verificationStatus)}${payment.reference ? ` • Ref ${payment.reference}` : ""}`,
      tag: formatStatus(payment.verificationStatus),
      tone: String(payment.verificationStatus).toUpperCase() === "VERIFIED"
        ? ("success" as const)
        : ("default" as const),
    })),
    ...tenant.moveOutNotices.map((notice) => ({
      id: `notice-${notice.id}`,
      kind: "Move out",
      title: `${formatStatus(notice.status)} move-out notice`,
      date: notice.noticeDate,
      description: `${getLeaseUnitLabel(notice.lease)} • Move-out date ${formatDate(notice.moveOutDate)}`,
      tag: formatStatus(notice.status),
      tone: "default" as const,
    })),
    ...tenant.actionLogs.map((log) => ({
      id: `action-${log.id}`,
      kind: "Action",
      title: formatStatus(log.action),
      date: log.createdAt,
      description:
        log.reason ||
        log.notes ||
        (log.unit
          ? `Related unit: ${getUnitLabel(log.unit)}`
          : log.lease
            ? `Related lease unit: ${getUnitLabel(log.lease.unit)}`
            : `Recorded by ${log.actor.fullName}`),
      tag: formatStatus(log.action),
      tone:
        String(log.action).toUpperCase().includes("BLACKLIST") ||
        String(log.action).toUpperCase().includes("DELETED")
          ? ("danger" as const)
          : String(log.action).toUpperCase().includes("RESTORED") ||
              String(log.action).toUpperCase() === "CREATED"
            ? ("success" as const)
            : ("default" as const),
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-[#f6f7fb] px-3 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <TenantHeroCard
          fullName={tenant.fullName}
          status={tenant.status}
          type={tenant.type}
          email={tenant.email}
          phone={tenant.phone}
          currentUnit={currentUnit}
          currentRent={currentRent}
          canManage={canManage}
          initials={getInitials(tenant.fullName)}
          tenantId={tenant.id}
          hasActiveLease={hasActiveLease}
          isDeleted={isDeleted}
          isBlacklisted={isBlacklisted}
          isArchived={isArchived}
        />

        <div className="grid gap-5 xl:grid-cols-[1.45fr_0.95fr]">
          <div className="space-y-5">
            <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <SectionHeader
                title="Tenant information"
                description="Core tenant identity, contact details, and compliance fields."
              />

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <DetailItem label="Full name" value={tenant.fullName} />
                <DetailItem label="Tenant type" value={formatStatus(tenant.type)} />
                <DetailItem label="Phone number" value={tenant.phone || "—"} />
                <DetailItem label="Email address" value={tenant.email || "—"} />
                <DetailItem label="National ID" value={tenant.nationalId || "—"} mono />
                <DetailItem label="KRA PIN" value={tenant.kraPin || "—"} mono />
                <DetailItem label="Company" value={tenant.companyName || "—"} />
                <DetailItem label="Data consent" value={formatBoolean(tenant.dataConsent)} />
                <DetailItem label="Marketing consent" value={formatBoolean(tenant.marketingConsent)} />
                <DetailItem label="Consent updated" value={formatDateTime(tenant.consentUpdatedAt)} />
                <DetailItem label="Profile image" value={tenant.profileImage?.fileName || "No file linked"} />
              </div>
            </section>

            <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <SectionHeader
                title="Lease portfolio"
                description="Current occupancy, rent terms, and complete lease history for this tenant."
              />

              <div className="mt-4 space-y-3">
                {tenant.leases.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
                    No lease records found for this tenant.
                  </div>
                ) : (
                  tenant.leases.map((lease) => {
                    const leaseActive = String(lease.status).toUpperCase() === "ACTIVE";

                    return (
                      <div
                        key={lease.id}
                        className="rounded-3xl border border-black/5 bg-[#fafafa] p-4 transition hover:border-black/10"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-neutral-950">
                              {getLeaseUnitLabel(lease)}
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">
                              {formatDate(lease.startDate)} — {formatDate(lease.endDate)}
                            </p>
                          </div>

                          <span
                            className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold ${getStatusClasses(
                              lease.status,
                            )}`}
                          >
                            {formatStatus(lease.status)}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                          <DetailItem label="Rent" value={formatCurrency(lease.monthlyRent)} />
                          <DetailItem label="Deposit" value={formatCurrency(lease.deposit)} />
                          <DetailItem label="Due day" value={lease.dueDay ? `${lease.dueDay}th day` : "—"} />
                          <DetailItem label="Lease start" value={formatDate(lease.startDate)} />
                          <DetailItem label="Lease end" value={formatDate(lease.endDate)} />
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <DetailItem label="Caretaker" value={lease.caretaker?.fullName || "Not assigned"} />
                          <DetailItem label="Caretaker email" value={lease.caretaker?.email || "—"} />
                        </div>

                        {lease.notes ? (
                          <div className="mt-4 rounded-2xl border border-black/5 bg-white p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                              Lease notes
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
                              {lease.notes}
                            </p>
                          </div>
                        ) : null}

                        {leaseActive ? (
                          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                            This is the tenant’s current active lease record.
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <SectionHeader
                title="Tenant history"
                description="Chronological history built from onboarding, leases, payments, notices, and tenant action logs."
              />

              <div className="mt-5 space-y-4">
                {tenantHistory.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
                    No tenant history is available yet.
                  </div>
                ) : (
                  tenantHistory.map((item) => {
                    const toneClasses =
                      item.tone === "success"
                        ? "border-emerald-200 bg-emerald-50"
                        : item.tone === "danger"
                          ? "border-red-200 bg-red-50"
                          : "border-black/5 bg-[#fafafa]";

                    return (
                      <div key={item.id} className={`rounded-3xl border p-4 ${toneClasses}`}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-700">
                                {item.kind}
                              </span>
                              <p className="text-sm font-semibold text-neutral-950">{item.title}</p>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-neutral-700">{item.description}</p>
                          </div>

                          <div className="shrink-0 text-right">
                            <span className="inline-flex rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-700">
                              {item.tag}
                            </span>
                            <p className="mt-2 text-xs text-neutral-500">{formatDateTime(item.date)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          <div className="space-y-5">
            <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <SectionHeader
                title="Account summary"
                description="Lifecycle, status, and high-level account overview."
              />

              <div className="mt-4 grid gap-3">
                <DetailItem label="Tenant since" value={formatDate(tenant.createdAt)} />
                <DetailItem label="Current unit" value={currentUnit} />
                <DetailItem label="Monthly rent" value={currentRent} />
                <DetailItem label="Deposit held" value={currentDeposit} />
                <DetailItem label="Archived at" value={formatDate(tenant.archivedAt)} />
                <DetailItem label="Blacklisted at" value={formatDate(tenant.blacklistedAt)} />
                <DetailItem label="Blacklist reason" value={tenant.blacklistReason || "—"} />
                <DetailItem label="Deleted at" value={formatDate(tenant.deletedAt)} />
                <DetailItem label="Payments logged" value={formatCurrency(totalPayments)} />
              </div>
            </section>

            <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <SectionHeader
                title="Next of kin"
                description="Emergency and contact fallback details linked to this tenant."
              />

              {tenant.nextOfKin ? (
                <div className="mt-4 grid gap-3">
                  <DetailItem label="Name" value={tenant.nextOfKin.name} />
                  <DetailItem label="Relationship" value={tenant.nextOfKin.relationship} />
                  <DetailItem label="Phone" value={tenant.nextOfKin.phone} />
                  <DetailItem label="Email" value={tenant.nextOfKin.email || "—"} />
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
                  No next of kin has been linked to this tenant.
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <SectionHeader
                title="Recent payments"
                description="Latest payment records linked to the tenant account."
              />

              <div className="mt-4 space-y-3">
                {tenant.payments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
                    No payment records found.
                  </div>
                ) : (
                  tenant.payments.map((payment) => (
                    <div key={payment.id} className="rounded-2xl border border-black/5 bg-[#fafafa] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-neutral-950">
                            {formatCurrency(payment.amount)} • {formatStatus(payment.targetType)}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {formatDateTime(payment.paidAt ?? payment.createdAt)} • {formatStatus(payment.method)}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                              payment.gatewayStatus,
                            )}`}
                          >
                            {formatStatus(payment.gatewayStatus)}
                          </span>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                              payment.verificationStatus,
                            )}`}
                          >
                            {formatStatus(payment.verificationStatus)}
                          </span>
                        </div>
                      </div>

                      <p className="mt-3 text-sm text-neutral-700">
                        <span className="font-semibold text-neutral-900">Reference:</span> {payment.reference || "—"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <SectionHeader
                title="Water bills"
                description="Recent utility billing history for units occupied by this tenant."
              />

              <div className="mt-4 space-y-3">
                {tenant.waterBills.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
                    No water bills found.
                  </div>
                ) : (
                  tenant.waterBills.map((bill) => (
                    <div key={bill.id} className="rounded-2xl border border-black/5 bg-[#fafafa] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-neutral-950">
                            {bill.period} • {formatCurrency(bill.total)}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {getUnitLabel(bill.unit)} • Due {formatDate(bill.dueDate)}
                          </p>
                        </div>

                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                            bill.status,
                          )}`}
                        >
                          {formatStatus(bill.status)}
                        </span>
                      </div>

                      <p className="mt-3 text-sm text-neutral-700">
                        <span className="font-semibold text-neutral-900">Units used:</span> {bill.unitsUsed}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <SectionHeader
                title="Move-out notices"
                description="Notice and inspection records associated with the tenant."
              />

              <div className="mt-4 space-y-3">
                {tenant.moveOutNotices.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
                    No move-out notices recorded.
                  </div>
                ) : (
                  tenant.moveOutNotices.map((notice) => (
                    <div key={notice.id} className="rounded-2xl border border-black/5 bg-[#fafafa] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-neutral-950">
                            {getLeaseUnitLabel(notice.lease)}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">
                            Notice {formatDate(notice.noticeDate)} • Move-out {formatDate(notice.moveOutDate)}
                          </p>
                        </div>

                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                            notice.status,
                          )}`}
                        >
                          {formatStatus(notice.status)}
                        </span>
                      </div>

                      {notice.inspection ? (
                        <div className="mt-3 rounded-2xl border border-black/5 bg-white p-3 text-sm text-neutral-700">
                          <p>
                            <span className="font-semibold text-neutral-900">Inspection:</span>{" "}
                            {formatStatus(notice.inspection.status)}
                          </p>
                          <p className="mt-1">
                            <span className="font-semibold text-neutral-900">Inspector:</span>{" "}
                            {notice.inspection.inspector.fullName}
                          </p>
                          <p className="mt-1">
                            <span className="font-semibold text-neutral-900">Scheduled:</span>{" "}
                            {formatDateTime(notice.inspection.scheduledAt)}
                          </p>
                          <p className="mt-1">
                            <span className="font-semibold text-neutral-900">Completed:</span>{" "}
                            {formatDateTime(notice.inspection.completedAt)}
                          </p>

                          {String(notice.inspection.status).toUpperCase() === "COMPLETED" ? (
                            <div className="mt-3">
                              <Link
                                href={`/dashboard/org/inspections/${notice.inspection.id}`}
                                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                              >
                                View inspection report
                              </Link>
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {notice.notes ? (
                        <p className="mt-3 text-sm text-neutral-700">
                          <span className="font-semibold text-neutral-900">Notes:</span> {notice.notes}
                        </p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <SectionHeader
                title="Internal notes"
                description="Private notes visible to authorised staff only."
              />

              <div className="mt-4 rounded-3xl border border-black/5 bg-[#fafafa] p-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-neutral-700">
                  {tenant.notes || "No notes available for this tenant."}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}