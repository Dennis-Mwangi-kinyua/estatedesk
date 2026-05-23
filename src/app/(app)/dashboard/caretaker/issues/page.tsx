import Link from "next/link";
import { Prisma, TicketPriority, TicketStatus } from "@prisma/client";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Hammer,
  Home,
  Plus,
  Wrench,
  Zap,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCurrentOrgId } from "@/lib/auth/org";
import { requireUserSession } from "@/lib/auth/session";
import { submitIssueResolutionReportAction } from "./actions";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    range?: string;
  }>;
};

type IssueWithRelations = Prisma.IssueTicketGetPayload<{
  include: {
    property: {
      select: {
        id: true;
        name: true;
      };
    };
    unit: {
      select: {
        id: true;
        houseNo: true;
        property: {
          select: {
            id: true;
            name: true;
          };
        };
        building: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    };
    assignedTo: {
      select: {
        id: true;
        fullName: true;
        email: true;
        phone: true;
      };
    };
    reportedBy: {
      select: {
        id: true;
        fullName: true;
        email: true;
        phone: true;
      };
    };
    resolutionReports: {
      select: {
        id: true;
        status: true;
        workSummary: true;
        materialsUsed: true;
        tenantInstructions: true;
        officeNotes: true;
        submittedAt: true;
      };
    };
  };
}>;

type IssueDataResult =
  | {
      ok: true;
      openIssues: number;
      inProgressIssues: number;
      resolvedTodayIssues: number;
      urgentIssues: number;
      issues: IssueWithRelations[];
      errorMessage?: never;
    }
  | {
      ok: false;
      openIssues: number;
      inProgressIssues: number;
      resolvedTodayIssues: number;
      urgentIssues: number;
      issues: IssueWithRelations[];
      errorMessage: string;
    };

type SummaryCardProps = {
  title: string;
  value: string;
  subtitle: string;
  href: string;
  isActive?: boolean;
  icon: React.ComponentType<{ className?: string }>;
};

const VALID_STATUSES = new Set<string>(Object.values(TicketStatus));
const VALID_PRIORITIES = new Set<string>(Object.values(TicketPriority));

function parseStatus(value: string | undefined) {
  if (!value) return null;

  const normalized = value.toUpperCase();

  return VALID_STATUSES.has(normalized)
    ? (normalized as TicketStatus)
    : null;
}

function parsePriority(value: string | undefined) {
  if (!value) return null;

  const normalized = value.toUpperCase();

  return VALID_PRIORITIES.has(normalized)
    ? (normalized as TicketPriority)
    : null;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  return date;
}

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function getPrismaErrorMessage(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return `Prisma error ${error.code}: ${error.message}`;
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown Prisma error while loading issues.";
}

function getIssueBoardTitle({
  status,
  priority,
  range,
}: {
  status: TicketStatus | null;
  priority: TicketPriority | null;
  range: string;
}) {
  if (priority === TicketPriority.URGENT) {
    return "Urgent Cases";
  }

  if (status === TicketStatus.OPEN) {
    return "Open Issues";
  }

  if (status === TicketStatus.IN_PROGRESS) {
    return "In Progress Issues";
  }

  if (status === TicketStatus.RESOLVED && range === "today") {
    return "Resolved Today";
  }

  if (status === TicketStatus.RESOLVED) {
    return "Resolved Issues";
  }

  if (status === TicketStatus.CLOSED) {
    return "Closed Issues";
  }

  if (status === TicketStatus.CANCELLED) {
    return "Cancelled Issues";
  }

  return "Current Issues";
}

function getIssueBoardDescription({
  status,
  priority,
  range,
}: {
  status: TicketStatus | null;
  priority: TicketPriority | null;
  range: string;
}) {
  if (priority === TicketPriority.URGENT) {
    return "High-priority issues that need immediate attention.";
  }

  if (status === TicketStatus.OPEN) {
    return "Issues awaiting review, assignment, or action.";
  }

  if (status === TicketStatus.IN_PROGRESS) {
    return "Issues currently being handled by staff or caretakers.";
  }

  if (status === TicketStatus.RESOLVED && range === "today") {
    return "Issues resolved within today’s workflow.";
  }

  if (status === TicketStatus.RESOLVED) {
    return "Issues marked as resolved.";
  }

  return "Track maintenance and operational issues in one workspace.";
}

function getStatusClass(status: TicketStatus) {
  if (status === TicketStatus.OPEN) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === TicketStatus.IN_PROGRESS) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-neutral-200 bg-neutral-50 text-neutral-600";
}

function getPriorityClass(priority: TicketPriority) {
  if (priority === TicketPriority.URGENT) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (priority === TicketPriority.HIGH) {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (priority === TicketPriority.MEDIUM) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-neutral-200 bg-neutral-50 text-neutral-600";
}

async function getIssueData({
  orgId,
  issueWhere,
  today,
}: {
  orgId: string;
  issueWhere: Prisma.IssueTicketWhereInput;
  today: Date;
}): Promise<IssueDataResult> {
  try {
    const [
      openIssues,
      inProgressIssues,
      resolvedTodayIssues,
      urgentIssues,
      issues,
    ] = await Promise.all([
      prisma.issueTicket.count({
        where: {
          orgId,
          status: TicketStatus.OPEN,
        },
      }),

      prisma.issueTicket.count({
        where: {
          orgId,
          status: TicketStatus.IN_PROGRESS,
        },
      }),

      prisma.issueTicket.count({
        where: {
          orgId,
          status: {
            in: [TicketStatus.RESOLVED, TicketStatus.CLOSED],
          },
          resolvedAt: {
            gte: today,
          },
        },
      }),

      prisma.issueTicket.count({
        where: {
          orgId,
          priority: TicketPriority.URGENT,
          status: {
            notIn: [
              TicketStatus.RESOLVED,
              TicketStatus.CLOSED,
              TicketStatus.CANCELLED,
            ],
          },
        },
      }),

      prisma.issueTicket.findMany({
        where: issueWhere,
        orderBy: [{ createdAt: "desc" }],
        take: 100,
        include: {
          property: {
            select: {
              id: true,
              name: true,
            },
          },
          unit: {
            select: {
              id: true,
              houseNo: true,
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
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          reportedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          resolutionReports: {
            orderBy: {
              submittedAt: "desc",
            },
            take: 1,
            select: {
              id: true,
              status: true,
              workSummary: true,
              materialsUsed: true,
              tenantInstructions: true,
              officeNotes: true,
              submittedAt: true,
            },
          },
        },
      }),
    ]);

    return {
      ok: true,
      openIssues,
      inProgressIssues,
      resolvedTodayIssues,
      urgentIssues,
      issues,
    };
  } catch (error) {
    console.error("Failed to load caretaker issues:", error);

    return {
      ok: false,
      openIssues: 0,
      inProgressIssues: 0,
      resolvedTodayIssues: 0,
      urgentIssues: 0,
      issues: [],
      errorMessage: getPrismaErrorMessage(error),
    };
  }
}

function SummaryCard({
  title,
  value,
  subtitle,
  href,
  isActive = false,
  icon: Icon,
}: SummaryCardProps) {
  return (
    <Link
      href={href}
      className={[
        "group block rounded-2xl border bg-white p-4 shadow-sm transition sm:p-5",
        isActive
          ? "border-neutral-950 ring-2 ring-neutral-950/10"
          : "border-neutral-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            {value}
          </p>

          <p className="mt-2 text-sm leading-6 text-neutral-500">{subtitle}</p>

          <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-neutral-700">
            Track issues
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </span>
        </div>

        <div
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition",
            isActive
              ? "bg-neutral-950 text-white"
              : "bg-neutral-100 text-neutral-700 group-hover:bg-neutral-950 group-hover:text-white",
          ].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Link>
  );
}

function ActionLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
    >
      <span className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-neutral-500" />
        {label}
      </span>

      <ArrowRight className="h-4 w-4 text-neutral-400" />
    </Link>
  );
}

function ErrorStateCard({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 sm:p-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
        <AlertCircle className="h-6 w-6 text-red-700" />
      </div>

      <h3 className="mt-4 text-center text-base font-semibold text-red-950 sm:text-lg">
        Could not load issue records
      </h3>

      <p className="mx-auto mt-2 max-w-2xl whitespace-pre-wrap text-center text-sm leading-6 text-red-700">
        {message}
      </p>

      <p className="mx-auto mt-4 max-w-2xl text-center text-xs leading-5 text-red-600">
        Check your terminal for the full Prisma error. This usually means the
        IssueTicket table, enum values, or relation names do not match the
        generated Prisma client.
      </p>
    </div>
  );
}

function EmptyStateCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/70 p-6 text-center sm:p-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
        <Wrench className="h-6 w-6 text-neutral-700" />
      </div>

      <h3 className="mt-4 text-base font-semibold text-neutral-900 sm:text-lg">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-500">
        {description}
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
        <Link
          href="/dashboard/caretaker/issues/new"
          className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          Create New Issue
        </Link>

        <Link
          href="/dashboard/caretaker/issues"
          className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
        >
          View All Issues
        </Link>
      </div>
    </div>
  );
}

function IssueCard({
  issue,
  currentUserId,
}: {
  issue: IssueWithRelations;
  currentUserId: string;
}) {
  const propertyName = issue.unit?.property.name ?? issue.property?.name ?? "—";
  const buildingName = issue.unit?.building?.name ?? "—";
  const unitName = issue.unit?.houseNo ?? "—";
  const latestReport = issue.resolutionReports[0] ?? null;
  const canSubmitReport =
    issue.status === TicketStatus.IN_PROGRESS &&
    issue.assignedTo?.id === currentUserId &&
    (!latestReport || latestReport.status === "REJECTED");

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-300 hover:shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                issue.status,
              )}`}
            >
              {issue.status.replaceAll("_", " ")}
            </span>

            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getPriorityClass(
                issue.priority,
              )}`}
            >
              {issue.priority}
            </span>
          </div>

          <h3 className="mt-3 text-base font-semibold text-neutral-950">
            {issue.title}
          </h3>

          <p className="mt-1 line-clamp-2 text-sm leading-6 text-neutral-500">
            {issue.description}
          </p>
        </div>

        <div className="text-sm text-neutral-500 sm:text-right">
          <p>Created</p>
          <p className="font-medium text-neutral-900">
            {formatDateTime(issue.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 border-t border-neutral-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">
            Property
          </p>
          <p className="mt-1 text-sm font-medium text-neutral-900">
            {propertyName}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">
            Building
          </p>
          <p className="mt-1 text-sm font-medium text-neutral-900">
            {buildingName}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">
            Unit
          </p>
          <p className="mt-1 text-sm font-medium text-neutral-900">
            {unitName}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">
            Assigned To
          </p>
          <p className="mt-1 text-sm font-medium text-neutral-900">
            {issue.assignedTo?.fullName ?? "Unassigned"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4">
        <p className="text-xs text-neutral-500">
          Reported by{" "}
          <span className="font-medium text-neutral-800">
            {issue.reportedBy?.fullName ?? "Unknown"}
          </span>
        </p>

        <span className="text-xs text-neutral-400">
          Last updated {formatDateTime(issue.updatedAt)}
        </span>
      </div>

      {latestReport ? (
        <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-neutral-950">
              Completion report
            </p>
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-neutral-600">
              {latestReport.status.replaceAll("_", " ")}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-neutral-700">
            {latestReport.workSummary}
          </p>
          {latestReport.officeNotes ? (
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              Office notes: {latestReport.officeNotes}
            </p>
          ) : null}
        </div>
      ) : null}

      {canSubmitReport ? (
        <form
          action={submitIssueResolutionReportAction}
          className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"
        >
          <input type="hidden" name="issueId" value={issue.id} />
          <p className="text-sm font-semibold text-neutral-950">
            Submit completion report
          </p>
          <p className="mt-1 text-xs leading-5 text-neutral-500">
            This goes to the office first. The ticket closes only after the
            tenant confirms the work.
          </p>
          <div className="mt-3 grid gap-3">
            <textarea
              name="workSummary"
              rows={3}
              required
              minLength={10}
              placeholder="What was done?"
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
            />
            <input
              name="materialsUsed"
              placeholder="Materials used (optional)"
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
            />
            <textarea
              name="tenantInstructions"
              rows={2}
              placeholder="Tenant instructions or follow-up notes (optional)"
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
            />
            <button
              type="submit"
              className="inline-flex w-fit items-center justify-center rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Submit report to office
            </button>
          </div>
        </form>
      ) : null}
    </article>
  );
}

function WorkflowStep({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-neutral-700 shadow-sm">
          {step}
        </div>

        <div>
          <p className="text-sm font-semibold text-neutral-900">{title}</p>
          <p className="mt-1 text-xs leading-5 text-neutral-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function IssuesPage({ searchParams }: PageProps) {
  const session = await requireUserSession();
  const orgId = await requireCurrentOrgId();
  const resolvedSearchParams = await searchParams;

  const status = parseStatus(resolvedSearchParams.status);
  const priority = parsePriority(resolvedSearchParams.priority);
  const range = resolvedSearchParams.range ?? "";

  const today = startOfToday();

  const issueWhere: Prisma.IssueTicketWhereInput = {
    orgId,
  };

  if (priority) {
    issueWhere.priority = priority;
  }

  if (status === TicketStatus.RESOLVED && range === "today") {
    issueWhere.status = {
      in: [TicketStatus.RESOLVED, TicketStatus.CLOSED],
    };
    issueWhere.resolvedAt = {
      gte: today,
    };
  } else if (status) {
    issueWhere.status = status;
  }

  const issueData = await getIssueData({
    orgId,
    issueWhere,
    today,
  });

  const boardTitle = getIssueBoardTitle({
    status,
    priority,
    range,
  });

  const boardDescription = getIssueBoardDescription({
    status,
    priority,
    range,
  });

  const isOpenActive = status === TicketStatus.OPEN;
  const isInProgressActive = status === TicketStatus.IN_PROGRESS;
  const isResolvedTodayActive =
    status === TicketStatus.RESOLVED && range === "today";
  const isUrgentActive = priority === TicketPriority.URGENT;

  return (
    <div className="min-h-full bg-neutral-100">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="space-y-5 sm:space-y-6">
          <header className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Operations
                </p>

                <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                  Issues
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                  View, track, and manage maintenance and operational issues
                  across properties in one organized workspace.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard/caretaker"
                  className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                >
                  Dashboard
                </Link>

                <Link
                  href="/dashboard/caretaker/issues/new"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  <Plus className="h-4 w-4" />
                  New Issue
                </Link>
              </div>
            </div>
          </header>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Open Issues"
              value={String(issueData.openIssues).padStart(2, "0")}
              subtitle="Awaiting review, assignment, or action."
              href="/dashboard/caretaker/issues?status=OPEN"
              isActive={isOpenActive}
              icon={AlertCircle}
            />

            <SummaryCard
              title="In Progress"
              value={String(issueData.inProgressIssues).padStart(2, "0")}
              subtitle="Currently being handled by staff or caretaker."
              href="/dashboard/caretaker/issues?status=IN_PROGRESS"
              isActive={isInProgressActive}
              icon={Hammer}
            />

            <SummaryCard
              title="Resolved Today"
              value={String(issueData.resolvedTodayIssues).padStart(2, "0")}
              subtitle="Closed and completed within today’s workflow."
              href="/dashboard/caretaker/issues?status=RESOLVED&range=today"
              isActive={isResolvedTodayActive}
              icon={CheckCircle2}
            />

            <SummaryCard
              title="Urgent Cases"
              value={String(issueData.urgentIssues).padStart(2, "0")}
              subtitle="High-priority issues needing immediate attention."
              href="/dashboard/caretaker/issues?priority=URGENT"
              isActive={isUrgentActive}
              icon={Zap}
            />
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm xl:col-span-2">
              <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-4 sm:px-5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-500">
                    Issue Board
                  </p>

                  <h2 className="text-lg font-semibold text-neutral-900">
                    {boardTitle}
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-neutral-500">
                    {boardDescription}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {(status || priority || range) && (
                    <Link
                      href="/dashboard/caretaker/issues"
                      className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50"
                    >
                      Clear filter
                    </Link>
                  )}

                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                    {issueData.issues.length} loaded
                  </span>
                </div>
              </div>

              <div className="space-y-3 p-4 sm:p-5">
                {!issueData.ok ? (
                  <ErrorStateCard message={issueData.errorMessage} />
                ) : issueData.issues.length === 0 ? (
                  <EmptyStateCard
                    title="No matching issues found"
                    description="No issue records match this card filter yet. Create a new issue or clear the filter to view all records."
                  />
                ) : (
                  issueData.issues.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      currentUserId={session.userId}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="space-y-5">
              <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
                <p className="text-sm font-medium text-neutral-500">
                  Quick Actions
                </p>

                <h2 className="mt-1 text-lg font-semibold text-neutral-900">
                  Useful shortcuts
                </h2>

                <div className="mt-4 grid gap-3">
                  <ActionLink
                    href="/dashboard/caretaker/issues/new"
                    label="Create issue"
                    icon={Plus}
                  />

                  <ActionLink
                    href="/dashboard/caretaker/issues?status=OPEN"
                    label="Track open issues"
                    icon={AlertCircle}
                  />

                  <ActionLink
                    href="/dashboard/caretaker/issues?status=IN_PROGRESS"
                    label="Track in-progress issues"
                    icon={Hammer}
                  />

                  <ActionLink
                    href="/dashboard/caretaker"
                    label="Go to dashboard"
                    icon={Home}
                  />

                  <ActionLink
                    href="/dashboard/caretaker/inspections"
                    label="View inspections"
                    icon={ClipboardList}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
                <p className="text-sm font-medium text-neutral-500">
                  Workflow Notes
                </p>

                <h2 className="mt-1 text-lg font-semibold text-neutral-900">
                  Suggested process
                </h2>

                <div className="mt-4 space-y-3">
                  <WorkflowStep
                    step="1"
                    title="Log the issue"
                    description="Capture title, property, unit, priority, and description."
                  />

                  <WorkflowStep
                    step="2"
                    title="Assign responsibility"
                    description="Link the issue to a caretaker, staff member, or contractor."
                  />

                  <WorkflowStep
                    step="3"
                    title="Track resolution"
                    description="Move from open to in-progress to resolved with timestamps."
                  />
                </div>
              </section>
            </div>
          </section>

          <footer className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-xs text-neutral-500 shadow-sm sm:px-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p>EstateDesk · Issues Management</p>
              <p>Professional maintenance and operations tracking</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
