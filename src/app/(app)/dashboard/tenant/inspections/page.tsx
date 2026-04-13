// src/app/(app)/dashboard/tenant/inspections/page.tsx

import Link from "next/link";
import type { ReactNode } from "react";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { Prisma, InspectionStatus, NoticeStatus } from "@prisma/client";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Home,
  XCircle,
} from "lucide-react";

const tenantInspectionsArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    moveOutNotices: {
      orderBy: {
        createdAt: "desc",
      },
      include: {
        lease: {
          include: {
            unit: {
              include: {
                property: true,
                building: true,
              },
            },
          },
        },
        inspection: {
          include: {
            inspector: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    },
  },
});

type TenantInspectionsResult = Prisma.TenantGetPayload<
  typeof tenantInspectionsArgs
>;

type TenantInspectionsPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

type PreparedNotice = {
  id: string;
  unitLabel: string;
  moveOutDateLabel: string;
  noticeDateLabel: string;
  noticeStatus: NoticeStatus;
  noticeStatusLabel: string;
  inspectionScheduledAtLabel: string;
  inspectionCompletedAtLabel: string;
  inspectionStatus: InspectionStatus | null;
  inspectionStatusLabel: string | null;
  inspectorName: string | null;
  inspectionNotes: string | null;
  noticeNotes: string | null;
};

const HISTORY_PAGE_SIZE = 10;

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getInspectionStatusClasses(status: InspectionStatus) {
  switch (status) {
    case "SCHEDULED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "CANCELLED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
  }
}

function getNoticeStatusClasses(status: NoticeStatus) {
  switch (status) {
    case "SUBMITTED":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "INSPECTION_SCHEDULED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "INSPECTION_COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "CLOSED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "CANCELLED":
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
    default:
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
  }
}

function clampPage(page: number, totalPages: number) {
  if (Number.isNaN(page) || page < 1) return 1;
  if (page > totalPages) return totalPages;
  return page;
}

function getUnitLabel(notice: TenantInspectionsResult["moveOutNotices"][number]) {
  const unit = notice.lease.unit;
  return `${unit.property.name} • Unit ${unit.houseNo}${
    unit.building?.name ? ` • ${unit.building.name}` : ""
  }`;
}

function prepareNotice(
  notice: TenantInspectionsResult["moveOutNotices"][number]
): PreparedNotice {
  return {
    id: notice.id,
    unitLabel: getUnitLabel(notice),
    moveOutDateLabel: formatDate(notice.moveOutDate),
    noticeDateLabel: formatDate(notice.noticeDate),
    noticeStatus: notice.status,
    noticeStatusLabel: notice.status.replaceAll("_", " "),
    inspectionScheduledAtLabel: formatDateTime(notice.inspection?.scheduledAt),
    inspectionCompletedAtLabel: formatDateTime(notice.inspection?.completedAt),
    inspectionStatus: notice.inspection?.status ?? null,
    inspectionStatusLabel: notice.inspection?.status
      ? notice.inspection.status.replaceAll("_", " ")
      : null,
    inspectorName: notice.inspection?.inspector.fullName ?? null,
    inspectionNotes: notice.inspection?.notes ?? null,
    noticeNotes: notice.notes ?? null,
  };
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

function EmptyState() {
  return (
    <SurfaceCard className="p-8 text-center">
      <h1 className="text-xl font-semibold tracking-tight text-neutral-950">
        Inspections
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        No inspection records found for your tenant account.
      </p>
    </SurfaceCard>
  );
}

function PaginationLink({
  page,
  currentPage,
  children,
  disabled = false,
}: {
  page: number;
  currentPage: number;
  children: ReactNode;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="inline-flex items-center rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm text-neutral-400">
        {children}
      </span>
    );
  }

  const active =
    page === currentPage
      ? "border-neutral-900 bg-neutral-900 text-white"
      : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50";

  return (
    <Link
      href={`?page=${page}`}
      className={`inline-flex items-center rounded-xl border px-3 py-2 text-sm font-medium ${active}`}
    >
      {children}
    </Link>
  );
}

export default async function TenantInspectionsPage({
  searchParams,
}: TenantInspectionsPageProps) {
  const session = await requireTenantAccess();

  if (!session.userId) {
    throw new Error("Missing user id in session");
  }

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const requestedPage = Number(resolvedSearchParams.page ?? "1");

  const tenant: TenantInspectionsResult | null = await prisma.tenant.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId,
      deletedAt: null,
    },
    ...tenantInspectionsArgs,
  });

  const notices = tenant?.moveOutNotices ?? [];

  if (!tenant || notices.length === 0) {
    return (
      <PageShell>
        <EmptyState />
      </PageShell>
    );
  }

  const preparedNotices = notices.map(prepareNotice);
  const noticesWithInspections = preparedNotices.filter(
    (notice) => notice.inspectionStatus !== null
  );

  const latestInspectionNotice = noticesWithInspections[0] ?? null;

  const totals = notices.reduce(
    (acc, notice) => {
      acc.totalNotices += 1;

      if (notice.inspection?.status === "SCHEDULED") acc.scheduled += 1;
      if (notice.inspection?.status === "COMPLETED") acc.completed += 1;
      if (notice.inspection?.status === "CANCELLED") acc.cancelled += 1;

      return acc;
    },
    {
      totalNotices: 0,
      scheduled: 0,
      completed: 0,
      cancelled: 0,
    }
  );

  const totalPages = Math.max(
    1,
    Math.ceil(preparedNotices.length / HISTORY_PAGE_SIZE)
  );
  const currentPage = clampPage(requestedPage, totalPages);
  const historyStart = (currentPage - 1) * HISTORY_PAGE_SIZE;
  const historyEnd = historyStart + HISTORY_PAGE_SIZE;
  const paginatedNotices = preparedNotices.slice(historyStart, historyEnd);

  return (
    <PageShell>
      <div className="space-y-4 sm:space-y-6">
        <SurfaceCard className="p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                Tenant Inspections
              </p>
              <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-neutral-950 sm:text-[32px]">
                Inspections
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                View inspections linked to your move-out notices, including
                schedule, inspector, status, and completion notes.
              </p>
            </div>

            {latestInspectionNotice ? (
              <div className="rounded-[24px] bg-[#f7f7fa] px-4 py-4 sm:px-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                  Latest Inspection
                </p>
                <p className="mt-1 text-base font-semibold text-neutral-950">
                  {latestInspectionNotice.unitLabel}
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  {latestInspectionNotice.inspectionScheduledAtLabel}
                </p>
              </div>
            ) : (
              <div className="rounded-[24px] bg-[#f7f7fa] px-4 py-4 sm:px-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                  Inspection Status
                </p>
                <p className="mt-1 text-base font-semibold text-neutral-950">
                  Awaiting scheduling
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  No inspection scheduled yet
                </p>
              </div>
            )}
          </div>
        </SurfaceCard>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:gap-4">
          <StatCard
            icon={<ClipboardCheck className="h-4 w-4" />}
            label="Move-Out Notices"
            value={totals.totalNotices}
          />
          <StatCard
            icon={<Clock3 className="h-4 w-4" />}
            label="Scheduled"
            value={totals.scheduled}
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Completed"
            value={totals.completed}
          />
          <StatCard
            icon={<XCircle className="h-4 w-4" />}
            label="Cancelled"
            value={totals.cancelled}
          />
        </section>

        <SurfaceCard className="p-4 sm:p-6 xl:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[22px] font-semibold tracking-tight text-neutral-950">
                Inspection History
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Move-out notices and any linked inspections for your tenancy.
              </p>
            </div>
            <span className="text-xs font-medium text-neutral-500">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <div className="mt-5 space-y-3 lg:hidden">
            {paginatedNotices.map((notice) => (
              <div
                key={notice.id}
                className="rounded-[22px] border border-black/5 bg-[#fafafa] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-950">
                      {notice.unitLabel}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Move-out date: {notice.moveOutDateLabel}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getNoticeStatusClasses(
                      notice.noticeStatus
                    )}`}
                  >
                    {notice.noticeStatusLabel}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-[16px] bg-white px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                      Notice Date
                    </p>
                    <p className="mt-1 text-sm font-semibold text-neutral-950">
                      {notice.noticeDateLabel}
                    </p>
                  </div>

                  <div className="rounded-[16px] bg-white px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                      Inspection
                    </p>
                    <p className="mt-1 text-sm font-semibold text-neutral-950">
                      {notice.inspectionScheduledAtLabel}
                    </p>
                  </div>
                </div>

                {notice.inspectionStatus ? (
                  <>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getInspectionStatusClasses(
                          notice.inspectionStatus
                        )}`}
                      >
                        {notice.inspectionStatusLabel}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-[16px] bg-white px-3 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                          Inspector
                        </p>
                        <p className="mt-1 text-sm font-semibold text-neutral-950">
                          {notice.inspectorName ?? "—"}
                        </p>
                      </div>

                      <div className="rounded-[16px] bg-white px-3 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                          Completed
                        </p>
                        <p className="mt-1 text-sm font-semibold text-neutral-950">
                          {notice.inspectionCompletedAtLabel}
                        </p>
                      </div>
                    </div>

                    {notice.inspectionNotes ? (
                      <div className="mt-3 rounded-[16px] bg-white px-3 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                          Inspection Notes
                        </p>
                        <p className="mt-1 text-sm text-neutral-700">
                          {notice.inspectionNotes}
                        </p>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="mt-3 rounded-[16px] bg-white px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                      Inspection
                    </p>
                    <p className="mt-1 text-sm text-neutral-700">
                      This move-out notice has not been scheduled for inspection yet.
                    </p>
                  </div>
                )}

                {notice.noticeNotes ? (
                  <div className="mt-3 rounded-[16px] bg-white px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                      Notice Notes
                    </p>
                    <p className="mt-1 text-sm text-neutral-700">
                      {notice.noticeNotes}
                    </p>
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-[16px] border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-500">
                    <Home className="mr-2 h-4 w-4" />
                    Move-out inspection flow
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 hidden overflow-hidden rounded-[24px] border border-black/5 bg-white lg:block">
            <table className="min-w-full text-sm">
              <thead className="border-b border-neutral-200 bg-[#fcfcfd]">
                <tr className="text-left text-neutral-500">
                  <th className="px-5 py-4 font-medium">Unit</th>
                  <th className="px-5 py-4 font-medium">Move-Out Date</th>
                  <th className="px-5 py-4 font-medium">Notice Status</th>
                  <th className="px-5 py-4 font-medium">Inspection</th>
                  <th className="px-5 py-4 font-medium">Inspection Status</th>
                  <th className="px-5 py-4 font-medium">Inspector</th>
                  <th className="px-5 py-4 font-medium">Completed</th>
                </tr>
              </thead>
              <tbody>
                {paginatedNotices.map((notice) => (
                  <tr
                    key={notice.id}
                    className="border-b border-neutral-100 last:border-0"
                  >
                    <td className="px-5 py-4 font-semibold text-neutral-950">
                      {notice.unitLabel}
                    </td>
                    <td className="px-5 py-4 text-neutral-600">
                      {notice.moveOutDateLabel}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getNoticeStatusClasses(
                          notice.noticeStatus
                        )}`}
                      >
                        {notice.noticeStatusLabel}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-neutral-600">
                      {notice.inspectionScheduledAtLabel}
                    </td>
                    <td className="px-5 py-4">
                      {notice.inspectionStatus ? (
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getInspectionStatusClasses(
                            notice.inspectionStatus
                          )}`}
                        >
                          {notice.inspectionStatusLabel}
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-neutral-600">
                      {notice.inspectorName ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-neutral-600">
                      {notice.inspectionCompletedAtLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4">
            <p className="text-sm text-neutral-500">
              Showing {historyStart + 1}–
              {Math.min(historyEnd, preparedNotices.length)} of{" "}
              {preparedNotices.length}
            </p>

            <div className="flex flex-wrap gap-2">
              <PaginationLink
                page={currentPage - 1}
                currentPage={currentPage}
                disabled={currentPage === 1}
              >
                Previous
              </PaginationLink>

              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .filter((page) => {
                  if (totalPages <= 5) return true;
                  if (page === 1 || page === totalPages) return true;
                  return Math.abs(page - currentPage) <= 1;
                })
                .map((page, index, pages) => {
                  const previousPage = pages[index - 1];
                  const showGap = previousPage && page - previousPage > 1;

                  return (
                    <div key={page} className="flex items-center gap-2">
                      {showGap ? (
                        <span className="px-1 text-sm text-neutral-400">…</span>
                      ) : null}
                      <PaginationLink page={page} currentPage={currentPage}>
                        {page}
                      </PaginationLink>
                    </div>
                  );
                })}

              <PaginationLink
                page={currentPage + 1}
                currentPage={currentPage}
                disabled={currentPage === totalPages}
              >
                Next
              </PaginationLink>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f2f7]">
              <CalendarDays className="h-4 w-4 text-neutral-700" />
            </div>
            <div>
              <h2 className="text-[18px] font-semibold tracking-tight text-neutral-950">
                How inspections work
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                In your schema, inspections are created from move-out notices.
                That means tenants see inspection records only when a move-out
                notice exists and an inspection is attached to it.
              </p>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </PageShell>
  );
}