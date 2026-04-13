import Link from "next/link";
import type { ReactNode } from "react";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { Prisma, TicketPriority, TicketStatus } from "@prisma/client";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  MessageSquareWarning,
  Plus,
  Wrench,
} from "lucide-react";

const tenantIssuesArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    leases: {
      where: {
        deletedAt: null,
      },
      select: {
        unitId: true,
        unit: {
          include: {
            property: true,
            building: true,
          },
        },
      },
    },
  },
});

type TenantIssuesPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

type TenantIssuesResult = Prisma.TenantGetPayload<typeof tenantIssuesArgs>;

const HISTORY_PAGE_SIZE = 10;

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getPriorityClasses(priority: TicketPriority) {
  switch (priority) {
    case "URGENT":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "HIGH":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "MEDIUM":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "LOW":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
  }
}

function getStatusClasses(status: TicketStatus) {
  switch (status) {
    case "OPEN":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "IN_PROGRESS":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "RESOLVED":
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
        My Issues
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        No maintenance or issue tickets found for your unit yet.
      </p>

      <div className="mt-5">
        <Link
          href="/dashboard/tenant/issues/report"
          className="inline-flex items-center rounded-[16px] bg-neutral-900 px-4 py-3 text-sm font-medium text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Report Issue
        </Link>
      </div>
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

export default async function TenantIssuesPage({
  searchParams,
}: TenantIssuesPageProps) {
  const session = await requireTenantAccess();

  if (!session.userId) {
    throw new Error("Missing user id in session");
  }

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const requestedPage = Number(resolvedSearchParams.page ?? "1");

  const tenant: TenantIssuesResult | null = await prisma.tenant.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId,
      deletedAt: null,
    },
    ...tenantIssuesArgs,
  });

  const leaseUnits = tenant?.leases ?? [];
  const unitIds = Array.from(new Set(leaseUnits.map((lease) => lease.unitId)));

  if (!tenant || unitIds.length === 0) {
    return (
      <PageShell>
        <EmptyState />
      </PageShell>
    );
  }

  const issues = await prisma.issueTicket.findMany({
    where: {
      orgId: session.activeOrgId,
      unitId: {
        in: unitIds,
      },
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      property: true,
      unit: {
        include: {
          property: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
      photoAsset: true,
    },
    take: 100,
  });

  if (issues.length === 0) {
    return (
      <PageShell>
        <EmptyState />
      </PageShell>
    );
  }

  const totalIssues = issues.length;
  const openIssues = issues.filter((issue) => issue.status === "OPEN").length;
  const inProgressIssues = issues.filter(
    (issue) => issue.status === "IN_PROGRESS"
  ).length;
  const resolvedIssues = issues.filter(
    (issue) => issue.status === "RESOLVED" || issue.status === "CLOSED"
  ).length;

  const latestIssue = issues[0] ?? null;
  const primaryUnit = leaseUnits[0]?.unit;

  const totalPages = Math.max(1, Math.ceil(issues.length / HISTORY_PAGE_SIZE));
  const currentPage = clampPage(requestedPage, totalPages);
  const historyStart = (currentPage - 1) * HISTORY_PAGE_SIZE;
  const historyEnd = historyStart + HISTORY_PAGE_SIZE;
  const paginatedIssues = issues.slice(historyStart, historyEnd);

  return (
    <PageShell>
      <div className="space-y-4 sm:space-y-6">
        <SurfaceCard className="p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                Tenant Support
              </p>
              <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-neutral-950 sm:text-[32px]">
                My Issues
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                Track maintenance requests and issue tickets for your unit,
                including status, priority, and resolution notes.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-[24px] bg-[#f7f7fa] px-4 py-4 sm:px-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                  Current Unit
                </p>
                <p className="mt-1 text-base font-semibold text-neutral-950">
                  {primaryUnit
                    ? `${primaryUnit.property.name} — ${primaryUnit.houseNo}`
                    : "N/A"}
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  {primaryUnit?.building?.name ?? "No building"}
                </p>
              </div>

              <Link
                href="/dashboard/tenant/issues/report"
                className="inline-flex items-center justify-center rounded-[16px] bg-neutral-900 px-4 py-3 text-sm font-medium text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Report Issue
              </Link>
            </div>
          </div>
        </SurfaceCard>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:gap-4">
          <StatCard
            icon={<MessageSquareWarning className="h-4 w-4" />}
            label="Total Issues"
            value={totalIssues}
          />
          <StatCard
            icon={<AlertCircle className="h-4 w-4" />}
            label="Open"
            value={openIssues}
          />
          <StatCard
            icon={<Clock3 className="h-4 w-4" />}
            label="In Progress"
            value={inProgressIssues}
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Resolved"
            value={resolvedIssues}
          />
        </section>

        {latestIssue ? (
          <SurfaceCard className="p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                  Latest Issue
                </p>
                <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-neutral-950">
                  {latestIssue.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  {latestIssue.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${getStatusClasses(
                    latestIssue.status
                  )}`}
                >
                  {latestIssue.status.replaceAll("_", " ")}
                </span>
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${getPriorityClasses(
                    latestIssue.priority
                  )}`}
                >
                  {latestIssue.priority}
                </span>
              </div>
            </div>
          </SurfaceCard>
        ) : null}

        <SurfaceCard className="p-4 sm:p-6 xl:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[22px] font-semibold tracking-tight text-neutral-950">
                Issue History
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                All issue tickets raised for your unit(s).
              </p>
            </div>
            <span className="text-xs font-medium text-neutral-500">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <div className="mt-5 space-y-3 lg:hidden">
            {paginatedIssues.map((issue) => {
              const unitLabel = issue.unit
                ? `${issue.unit.property.name} • Unit ${issue.unit.houseNo}`
                : issue.property?.name ?? "Property issue";

              return (
                <div
                  key={issue.id}
                  className="rounded-[22px] border border-black/5 bg-[#fafafa] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-950">
                        {issue.title}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {unitLabel}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                          issue.status
                        )}`}
                      >
                        {issue.status.replaceAll("_", " ")}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getPriorityClasses(
                          issue.priority
                        )}`}
                      >
                        {issue.priority}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[16px] bg-white px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                      Description
                    </p>
                    <p className="mt-1 text-sm text-neutral-700">
                      {issue.description}
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-[16px] bg-white px-3 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                        Created
                      </p>
                      <p className="mt-1 text-sm font-semibold text-neutral-950">
                        {formatDate(issue.createdAt)}
                      </p>
                    </div>

                    <div className="rounded-[16px] bg-white px-3 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                        Resolved
                      </p>
                      <p className="mt-1 text-sm font-semibold text-neutral-950">
                        {formatDate(issue.resolvedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-[16px] bg-white px-3 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                        Assigned To
                      </p>
                      <p className="mt-1 text-sm font-semibold text-neutral-950">
                        {issue.assignedTo?.fullName ?? "Unassigned"}
                      </p>
                    </div>

                    <div className="rounded-[16px] bg-white px-3 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                        Category
                      </p>
                      <p className="mt-1 text-sm font-semibold text-neutral-950">
                        Maintenance Issue
                      </p>
                    </div>
                  </div>

                  {issue.resolutionNotes ? (
                    <div className="mt-3 rounded-[16px] bg-white px-3 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                        Resolution Notes
                      </p>
                      <p className="mt-1 text-sm text-neutral-700">
                        {issue.resolutionNotes}
                      </p>
                    </div>
                  ) : null}

                  {issue.photoAsset ? (
                    <div className="mt-3 rounded-[16px] bg-white px-3 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                        Attachment
                      </p>
                      <p className="mt-1 text-sm text-neutral-700">
                        Photo attached to this issue.
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-[16px] border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-500">
                      <Wrench className="mr-2 h-4 w-4" />
                      Ticket tracked by management
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 hidden overflow-hidden rounded-[24px] border border-black/5 bg-white lg:block">
            <table className="min-w-full text-sm">
              <thead className="border-b border-neutral-200 bg-[#fcfcfd]">
                <tr className="text-left text-neutral-500">
                  <th className="px-5 py-4 font-medium">Issue</th>
                  <th className="px-5 py-4 font-medium">Unit</th>
                  <th className="px-5 py-4 font-medium">Priority</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Assigned To</th>
                  <th className="px-5 py-4 font-medium">Created</th>
                  <th className="px-5 py-4 font-medium">Resolved</th>
                </tr>
              </thead>
              <tbody>
                {paginatedIssues.map((issue) => {
                  const unitLabel = issue.unit
                    ? `${issue.unit.property.name} • Unit ${issue.unit.houseNo}`
                    : issue.property?.name ?? "Property issue";

                  return (
                    <tr
                      key={issue.id}
                      className="border-b border-neutral-100 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-neutral-950">
                            {issue.title}
                          </p>
                          <p className="mt-1 text-neutral-500">
                            {issue.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-neutral-600">
                        {unitLabel}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getPriorityClasses(
                            issue.priority
                          )}`}
                        >
                          {issue.priority}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                            issue.status
                          )}`}
                        >
                          {issue.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-neutral-600">
                        {issue.assignedTo?.fullName ?? "Unassigned"}
                      </td>
                      <td className="px-5 py-4 text-neutral-600">
                        {formatDate(issue.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-neutral-600">
                        {formatDate(issue.resolvedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4">
            <p className="text-sm text-neutral-500">
              Showing {historyStart + 1}–{Math.min(historyEnd, issues.length)} of{" "}
              {issues.length}
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
      </div>
    </PageShell>
  );
}