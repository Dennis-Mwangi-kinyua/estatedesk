import Link from "next/link";
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

export const dynamic = "force-dynamic";

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            {value}
          </p>
          <p className="mt-2 text-sm leading-6 text-neutral-500">{subtitle}</p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
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

function EmptyStateCard() {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/70 p-6 text-center sm:p-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
        <Wrench className="h-6 w-6 text-neutral-700" />
      </div>

      <h3 className="mt-4 text-base font-semibold text-neutral-900 sm:text-lg">
        No issues loaded yet
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-500">
        The layout is ready. Next, connect your Prisma issue model so open,
        in-progress, and resolved records can be displayed here.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
        <Link
          href="/dashboard/caretaker/issues/new"
          className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          Create New Issue
        </Link>

        <Link
          href="/dashboard/caretaker"
          className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
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

export default function IssuesPage() {
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
              value="08"
              subtitle="Awaiting review, assignment, or action."
              icon={AlertCircle}
            />
            <SummaryCard
              title="In Progress"
              value="05"
              subtitle="Currently being handled by staff or caretaker."
              icon={Hammer}
            />
            <SummaryCard
              title="Resolved Today"
              value="03"
              subtitle="Closed and completed within today’s workflow."
              icon={CheckCircle2}
            />
            <SummaryCard
              title="Urgent Cases"
              value="02"
              subtitle="High-priority issues needing immediate attention."
              icon={Zap}
            />
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="xl:col-span-2 rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-4 sm:px-5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-500">
                    Issue Board
                  </p>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    Current issues
                  </h2>
                </div>

                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                  Ready for Prisma data
                </span>
              </div>

              <div className="p-4 sm:p-5">
                <EmptyStateCard />
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