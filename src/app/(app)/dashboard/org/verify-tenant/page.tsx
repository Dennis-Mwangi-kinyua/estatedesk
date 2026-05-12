import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import {
  approveTenantTransferAction,
  rejectTenantTransferAction,
  requestTenantTransferAction,
} from "./actions";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

type TenantVerificationResult = {
  id: string;
  orgId: string;
  fullName: string;
  phone: string;
  email: string | null;
  nationalId: string | null;
  kraPin: string | null;
  status: string;
  identityId: string | null;
  blacklistReason: string | null;
  blacklistedAt: Date | null;
  createdAt: Date;
  org: {
    id: string;
    name: string;
  };
  leases: Array<{
    id: string;
    startDate: Date;
    endDate: Date | null;
    status: string;
    monthlyRent: unknown;
    unit: {
      houseNo: string;
      property: { name: string | null } | null;
      building: { name: string | null } | null;
    } | null;
  }>;
  payments: Array<{
    id: string;
    amount: unknown;
    targetType: string;
    gatewayStatus: string;
    verificationStatus: string;
    paidAt: Date | null;
    createdAt: Date;
  }>;
  moveOutNotices: Array<{
    id: string;
    status: string;
    noticeDate: Date;
    moveOutDate: Date;
  }>;
  transferRequests: Array<{
    id: string;
    status: string;
    createdTenantId: string | null;
    requestedAt: Date;
    reviewedAt: Date | null;
  }>;
  identity: {
    id: string;
    historyRecords: Array<{
      id: string;
      orgId: string;
      status: string;
      propertyName: string | null;
      buildingName: string | null;
      unitHouseNo: string | null;
      leaseStartDate: Date | null;
      leaseEndDate: Date | null;
      moveOutDate: Date | null;
      monthlyRent: unknown;
      paymentCount: number;
      totalPaid: unknown;
      notes: string | null;
      createdAt: Date;
      org: {
        name: string;
      };
    }>;
    tenants: Array<{
      id: string;
      orgId: string;
      fullName: string;
      status: string;
      archivedAt: Date | null;
      org: {
        name: string;
      };
    }>;
  } | null;
};

function normalizeSearch(rawSearch?: string) {
  return rawSearch?.trim().slice(0, 100) ?? "";
}

function toNumber(value: unknown): number {
  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return Number(value ?? 0);
}

function formatCurrency(value: unknown) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Current";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function formatStatus(status: string) {
  if (!status) return "Unknown";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function getStatusClasses(status: string) {
  switch (String(status).toUpperCase()) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "BLACKLISTED":
      return "border-red-200 bg-red-50 text-red-700";
    case "INACTIVE":
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function getUnitLabel(
  unit: TenantVerificationResult["leases"][number]["unit"],
) {
  if (!unit) return "Unit not recorded";

  return [
    unit.property?.name,
    unit.building?.name,
    unit.houseNo ? `Unit ${unit.houseNo}` : null,
  ]
    .filter(Boolean)
    .join(" / ");
}

function getPaidCount(result: TenantVerificationResult) {
  return result.payments.filter(
    (payment) =>
      payment.gatewayStatus === "SUCCESS" ||
      payment.verificationStatus === "VERIFIED",
  ).length;
}

function getTotalPaid(result: TenantVerificationResult) {
  return result.payments.reduce((total, payment) => {
    const paid =
      payment.gatewayStatus === "SUCCESS" ||
      payment.verificationStatus === "VERIFIED";

    return paid ? total + toNumber(payment.amount) : total;
  }, 0);
}

function tenantHasMovedOut(result: TenantVerificationResult) {
  return (
    result.moveOutNotices.length > 0 ||
    result.leases.every((lease) => lease.status !== "ACTIVE")
  );
}

export default async function VerifyTenantPage({ searchParams }: PageProps) {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        No active organisation found for your account.
      </div>
    );
  }

  if (session.activeOrgRole !== "ADMIN") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Only organisation admins can verify tenants.
      </div>
    );
  }

  const params = searchParams ? await searchParams : {};
  const search = normalizeSearch(params.q);
  const canSearch = search.length >= 3;

  let results: TenantVerificationResult[] = [];
  const incomingTransferRequests = await prisma.tenantTransferRequest.findMany({
    where: {
      sourceOrgId: session.activeOrgId,
      status: "PENDING",
    },
    orderBy: {
      requestedAt: "desc",
    },
    take: 20,
    select: {
      id: true,
      message: true,
      requestedAt: true,
      targetOrg: {
        select: {
          name: true,
        },
      },
      requestedBy: {
        select: {
          fullName: true,
          email: true,
        },
      },
      sourceTenant: {
        select: {
          fullName: true,
          phone: true,
          email: true,
          nationalId: true,
          status: true,
          moveOutNotices: {
            orderBy: {
              moveOutDate: "desc",
            },
            take: 1,
            select: {
              moveOutDate: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (canSearch) {
    results = await prisma.tenant.findMany({
      where: {
        deletedAt: null,
        OR: [
          { phone: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { nationalId: { contains: search, mode: "insensitive" } },
          { kraPin: { contains: search, mode: "insensitive" } },
          { fullName: { contains: search, mode: "insensitive" } },
        ],
      },
      orderBy: [{ orgId: "asc" }, { createdAt: "desc" }],
      take: 25,
      select: {
        id: true,
        orgId: true,
        fullName: true,
        phone: true,
        email: true,
        nationalId: true,
        kraPin: true,
        status: true,
        identityId: true,
        blacklistReason: true,
        blacklistedAt: true,
        createdAt: true,
        org: {
          select: {
            id: true,
            name: true,
          },
        },
        leases: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            startDate: "desc",
          },
          take: 5,
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            monthlyRent: true,
            unit: {
              select: {
                houseNo: true,
                property: {
                  select: {
                    name: true,
                  },
                },
                building: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        payments: {
          orderBy: {
            createdAt: "desc",
          },
          take: 12,
          select: {
            id: true,
            amount: true,
            targetType: true,
            gatewayStatus: true,
            verificationStatus: true,
            paidAt: true,
            createdAt: true,
          },
        },
        moveOutNotices: {
          orderBy: {
            moveOutDate: "desc",
          },
          take: 5,
          select: {
            id: true,
            status: true,
            noticeDate: true,
            moveOutDate: true,
          },
        },
        transferRequests: {
          where: {
            targetOrgId: session.activeOrgId,
          },
          orderBy: {
            requestedAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            status: true,
            createdTenantId: true,
            requestedAt: true,
            reviewedAt: true,
          },
        },
        identity: {
          select: {
            id: true,
            historyRecords: {
              orderBy: [{ moveOutDate: "desc" }, { createdAt: "desc" }],
              take: 10,
              select: {
                id: true,
                orgId: true,
                status: true,
                propertyName: true,
                buildingName: true,
                unitHouseNo: true,
                leaseStartDate: true,
                leaseEndDate: true,
                moveOutDate: true,
                monthlyRent: true,
                paymentCount: true,
                totalPaid: true,
                notes: true,
                createdAt: true,
                org: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            tenants: {
              orderBy: {
                createdAt: "desc",
              },
              take: 10,
              select: {
                id: true,
                orgId: true,
                fullName: true,
                status: true,
                archivedAt: true,
                org: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  const currentOrgResults = results.filter(
    (result) => result.orgId === session.activeOrgId,
  );
  const otherOrgResults = results.filter(
    (result) => result.orgId !== session.activeOrgId,
  );
  const hasResults = results.length > 0;

  return (
    <div className="min-h-screen bg-[#f5f5f7] px-3 pb-6 pt-3 sm:px-4 sm:pt-4">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="rounded-[28px] border border-black/5 bg-white/90 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
                Verify Tenant
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-neutral-600">
                Search across tenant records from every organisation, then
                review lease, payment, and move-out history before onboarding.
              </p>
            </div>

            <Link
              href="/dashboard/org/tenants/new"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-medium text-white transition hover:bg-neutral-800 active:scale-[0.99]"
            >
              Create tenant
            </Link>
          </div>
        </div>

        {incomingTransferRequests.length > 0 ? (
          <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-amber-950">
                Pending transfer requests
              </h3>
              <p className="text-sm text-amber-800">
                Other organisations are asking to transfer tenants previously
                recorded under your organisation.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {incomingTransferRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl border border-amber-200 bg-white p-4"
                >
                  <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                    <div>
                      <p className="font-semibold text-neutral-950">
                        {request.sourceTenant.fullName}
                      </p>
                      <p className="mt-1 text-sm text-neutral-600">
                        Requested by {request.targetOrg.name} on{" "}
                        {formatDate(request.requestedAt)}
                      </p>
                      <p className="mt-2 text-sm text-neutral-700">
                        {request.sourceTenant.phone}
                        {request.sourceTenant.email
                          ? ` / ${request.sourceTenant.email}`
                          : ""}
                        {request.sourceTenant.nationalId
                          ? ` / ID ${request.sourceTenant.nationalId}`
                          : ""}
                      </p>
                      {request.sourceTenant.moveOutNotices[0] ? (
                        <p className="mt-2 text-sm text-neutral-600">
                          Move-out:{" "}
                          {formatDate(
                            request.sourceTenant.moveOutNotices[0].moveOutDate,
                          )}{" "}
                          ({formatStatus(
                            request.sourceTenant.moveOutNotices[0].status,
                          )}
                          )
                        </p>
                      ) : null}
                      {request.message ? (
                        <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                          {request.message}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                      <form action={approveTenantTransferAction}>
                        <input
                          type="hidden"
                          name="transferId"
                          value={request.id}
                        />
                        <button
                          type="submit"
                          className="inline-flex h-10 w-full items-center justify-center rounded-2xl bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800"
                        >
                          Approve transfer
                        </button>
                      </form>

                      <form action={rejectTenantTransferAction}>
                        <input
                          type="hidden"
                          name="transferId"
                          value={request.id}
                        />
                        <input
                          type="hidden"
                          name="reviewNotes"
                          value="Rejected from verification dashboard."
                        />
                        <button
                          type="submit"
                          className="inline-flex h-10 w-full items-center justify-center rounded-2xl border border-red-200 bg-white px-4 text-sm font-medium text-red-700 transition hover:bg-red-50"
                        >
                          Reject
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="rounded-[28px] border border-black/5 bg-white/90 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.05)] backdrop-blur">
          <form className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <input
              type="text"
              name="q"
              defaultValue={search}
              placeholder="Search by phone, email, national ID, KRA PIN, or name"
              className="h-12 w-full rounded-2xl border border-black/10 bg-[#f7f7f8] px-4 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white"
            />

            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-neutral-950 px-6 text-sm font-medium text-white transition hover:bg-neutral-800 active:scale-[0.99]"
            >
              Verify tenant
            </button>
          </form>

          {search && !canSearch ? (
            <p className="mt-3 text-sm text-amber-700">
              Enter at least 3 characters to verify a tenant.
            </p>
          ) : null}
        </div>

        {canSearch ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-black/5 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-neutral-400">
                Matches
              </p>
              <p className="mt-2 text-2xl font-semibold text-neutral-950">
                {results.length}
              </p>
            </div>
            <div className="rounded-[24px] border border-black/5 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-neutral-400">
                In this organisation
              </p>
              <p className="mt-2 text-2xl font-semibold text-neutral-950">
                {currentOrgResults.length}
              </p>
            </div>
            <div className="rounded-[24px] border border-black/5 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-neutral-400">
                Other organisations
              </p>
              <p className="mt-2 text-2xl font-semibold text-neutral-950">
                {otherOrgResults.length}
              </p>
            </div>
          </div>
        ) : null}

        {!search ? (
          <div className="rounded-[28px] border border-black/5 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-neutral-600">
              Start with a phone number, email, national ID, KRA PIN, or tenant
              name.
            </p>
          </div>
        ) : null}

        {canSearch && !hasResults ? (
          <div className="rounded-[28px] border border-black/5 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-medium text-neutral-950">
              No tenant history found.
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              You can create a new tenant record if their details are confirmed.
            </p>
          </div>
        ) : null}

        {hasResults ? (
          <div className="space-y-4">
            {results.map((tenant) => {
              const isCurrentOrg = tenant.orgId === session.activeOrgId;
              const paidCount = getPaidCount(tenant);
              const totalPaid = getTotalPaid(tenant);
              const movedOut = tenantHasMovedOut(tenant);
              const transferRequest = tenant.transferRequests[0] ?? null;
              const linkedOrgRecords =
                tenant.identity?.tenants.filter(
                  (record) => record.id !== tenant.id,
                ) ?? [];
              const identityHistory = tenant.identity?.historyRecords ?? [];

              return (
                <section
                  key={tenant.id}
                  className="overflow-hidden rounded-[32px] border border-black/5 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
                >
                  <div className="border-b border-black/5 p-4 sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-neutral-950">
                            {tenant.fullName}
                          </h3>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                              tenant.status,
                            )}`}
                          >
                            {formatStatus(tenant.status)}
                          </span>
                          <span className="inline-flex rounded-full border border-black/10 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-600">
                            {isCurrentOrg ? "Your org" : "Other org"}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-neutral-600">
                          {tenant.org.name}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        {transferRequest?.status === "APPROVED" ? (
                          <span className="inline-flex h-10 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-medium text-emerald-700">
                            Transfer approved
                          </span>
                        ) : transferRequest?.status === "PENDING" ? (
                          <span className="inline-flex h-10 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-4 text-sm font-medium text-amber-800">
                            Transfer requested
                          </span>
                        ) : !isCurrentOrg && movedOut ? (
                          <form action={requestTenantTransferAction}>
                            <input
                              type="hidden"
                              name="sourceTenantId"
                              value={tenant.id}
                            />
                            <input type="hidden" name="search" value={search} />
                            <input
                              type="hidden"
                              name="message"
                              value="Please approve transfer of this moved-out tenant record."
                            />
                            <button
                              type="submit"
                              className="inline-flex h-10 items-center justify-center rounded-2xl bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800"
                            >
                              Request transfer
                            </button>
                          </form>
                        ) : null}

                        <span className="inline-flex h-10 items-center justify-center rounded-2xl border border-black/10 bg-neutral-50 px-4 text-sm font-medium text-neutral-700">
                          Verification view only
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <div className="rounded-2xl bg-[#f7f7f8] p-3">
                        <p className="text-xs font-medium uppercase text-neutral-400">
                          Phone
                        </p>
                        <p className="mt-1 break-all text-sm font-medium text-neutral-900">
                          {tenant.phone}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[#f7f7f8] p-3">
                        <p className="text-xs font-medium uppercase text-neutral-400">
                          Email
                        </p>
                        <p className="mt-1 break-all text-sm font-medium text-neutral-900">
                          {tenant.email ?? "—"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[#f7f7f8] p-3">
                        <p className="text-xs font-medium uppercase text-neutral-400">
                          National ID
                        </p>
                        <p className="mt-1 text-sm font-medium text-neutral-900">
                          {tenant.nationalId ?? "—"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[#f7f7f8] p-3">
                        <p className="text-xs font-medium uppercase text-neutral-400">
                          Total paid
                        </p>
                        <p className="mt-1 text-sm font-medium text-neutral-900">
                          {formatCurrency(totalPaid)}
                        </p>
                      </div>
                    </div>

                    {tenant.status === "BLACKLISTED" ? (
                      <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                        Blacklisted {formatDate(tenant.blacklistedAt)}.
                        {tenant.blacklistReason
                          ? ` ${tenant.blacklistReason}`
                          : ""}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-4 p-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold text-neutral-950">
                          Lease history
                        </h4>
                        <span className="text-xs text-neutral-500">
                          {tenant.leases.length} shown
                        </span>
                      </div>

                      {tenant.leases.length === 0 ? (
                        <div className="rounded-2xl bg-[#f7f7f8] p-4 text-sm text-neutral-600">
                          No lease history recorded.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {tenant.leases.map((lease) => (
                            <div
                              key={lease.id}
                              className="rounded-2xl border border-black/5 bg-[#fafafa] p-3"
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="text-sm font-medium text-neutral-950">
                                    {getUnitLabel(lease.unit)}
                                  </p>
                                  <p className="mt-1 text-xs text-neutral-500">
                                    {formatDate(lease.startDate)} to{" "}
                                    {formatDate(lease.endDate)}
                                  </p>
                                </div>
                                <div className="text-left sm:text-right">
                                  <p className="text-sm font-medium text-neutral-900">
                                    {formatCurrency(lease.monthlyRent)}
                                  </p>
                                  <p className="text-xs text-neutral-500">
                                    {formatStatus(lease.status)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-2xl bg-[#f7f7f8] p-4">
                        <p className="text-xs font-medium uppercase text-neutral-400">
                          Payment signals
                        </p>
                        <p className="mt-2 text-sm text-neutral-700">
                          {paidCount} verified or successful payments in the
                          latest {tenant.payments.length} payment records.
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#f7f7f8] p-4">
                        <p className="text-xs font-medium uppercase text-neutral-400">
                          Move-out history
                        </p>
                        {tenant.moveOutNotices.length === 0 ? (
                          <p className="mt-2 text-sm text-neutral-600">
                            No move-out notices recorded.
                          </p>
                        ) : (
                          <div className="mt-2 space-y-2">
                            {tenant.moveOutNotices.map((notice) => (
                              <div
                                key={notice.id}
                                className="flex items-center justify-between gap-3 text-sm"
                              >
                                <span className="text-neutral-700">
                                  {formatDate(notice.moveOutDate)}
                                </span>
                                <span className="font-medium text-neutral-950">
                                  {formatStatus(notice.status)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl bg-[#f7f7f8] p-4">
                        <p className="text-xs font-medium uppercase text-neutral-400">
                          Previous organisations
                        </p>
                        {linkedOrgRecords.length === 0 ? (
                          <p className="mt-2 text-sm text-neutral-600">
                            No linked organisation records yet.
                          </p>
                        ) : (
                          <div className="mt-2 space-y-2">
                            {linkedOrgRecords.map((record) => (
                              <div
                                key={record.id}
                                className="flex items-center justify-between gap-3 text-sm"
                              >
                                <span className="min-w-0 truncate text-neutral-700">
                                  {record.org.name}
                                </span>
                                <span className="shrink-0 font-medium text-neutral-950">
                                  {formatStatus(record.status)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {identityHistory.length > 0 ? (
                    <div className="border-t border-black/5 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold text-neutral-950">
                          Retained tenancy records
                        </h4>
                        <span className="text-xs text-neutral-500">
                          {identityHistory.length} shown
                        </span>
                      </div>

                      <div className="grid gap-2 md:grid-cols-2">
                        {identityHistory.map((record) => (
                          <div
                            key={record.id}
                            className="rounded-2xl border border-black/5 bg-[#fafafa] p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-neutral-950">
                                  {record.org.name}
                                </p>
                                <p className="mt-1 text-xs text-neutral-500">
                                  {[
                                    record.propertyName,
                                    record.buildingName,
                                    record.unitHouseNo
                                      ? `Unit ${record.unitHouseNo}`
                                      : null,
                                  ]
                                    .filter(Boolean)
                                    .join(" / ") || "Unit not recorded"}
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full border border-neutral-200 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700">
                                {formatStatus(record.status)}
                              </span>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-neutral-400">Lease</p>
                                <p className="mt-0.5 font-medium text-neutral-800">
                                  {formatDate(record.leaseStartDate)} to{" "}
                                  {formatDate(record.leaseEndDate)}
                                </p>
                              </div>
                              <div>
                                <p className="text-neutral-400">Move-out</p>
                                <p className="mt-0.5 font-medium text-neutral-800">
                                  {formatDate(record.moveOutDate)}
                                </p>
                              </div>
                              <div>
                                <p className="text-neutral-400">Rent</p>
                                <p className="mt-0.5 font-medium text-neutral-800">
                                  {record.monthlyRent
                                    ? formatCurrency(record.monthlyRent)
                                    : "—"}
                                </p>
                              </div>
                              <div>
                                <p className="text-neutral-400">Paid</p>
                                <p className="mt-0.5 font-medium text-neutral-800">
                                  {formatCurrency(record.totalPaid)} ·{" "}
                                  {record.paymentCount} records
                                </p>
                              </div>
                            </div>

                            {record.notes ? (
                              <p className="mt-3 line-clamp-2 text-xs leading-5 text-neutral-600">
                                {record.notes}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
