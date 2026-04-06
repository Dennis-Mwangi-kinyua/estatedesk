import Link from "next/link";

export const dynamic = "force-dynamic";

function SummaryCard({
  title,
  value,
  subtitle,
  emoji,
}: {
  title: string;
  value: string;
  subtitle: string;
  emoji: string;
}) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">
            {value}
          </p>
          <p className="mt-2 text-xs leading-5 text-neutral-500">{subtitle}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100 text-xl">
          {emoji}
        </div>
      </div>
    </div>
  );
}

function EmptyStateCard() {
  return (
    <div className="rounded-3xl border border-dashed border-neutral-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-2xl">
        🛠️
      </div>

      <h3 className="mt-4 text-lg font-semibold text-neutral-900">
        No issues loaded yet
      </h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-500">
        This page structure is ready. The next step is connecting it to your
        Prisma issue model so open, in-progress, and resolved issues can render
        here.
      </p>

      <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/issues/new"
          className="inline-flex items-center justify-center rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          Create New Issue
        </Link>
        <Link
          href="/dashboard/caretaker"
          className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default function IssuesPage() {
  return (
    <div className="min-h-full bg-[#f5f5f7]">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-4 sm:px-5 sm:py-5 md:px-6 lg:px-8">
        <header className="rounded-[28px] border border-black/5 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
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
                className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                Dashboard
              </Link>
              <Link
                href="/issues/new"
                className="inline-flex items-center justify-center rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
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
            emoji="🚨"
          />
          <SummaryCard
            title="In Progress"
            value="05"
            subtitle="Currently being handled by staff or caretaker."
            emoji="🧰"
          />
          <SummaryCard
            title="Resolved Today"
            value="03"
            subtitle="Closed and completed within today’s workflow."
            emoji="✅"
          />
          <SummaryCard
            title="Urgent Cases"
            value="02"
            subtitle="High-priority issues needing immediate attention."
            emoji="⚡"
          />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-[28px] border border-black/5 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-4">
              <div>
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

            <div className="p-5">
              <EmptyStateCard />
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-neutral-500">
                Quick Actions
              </p>
              <h2 className="mt-1 text-lg font-semibold text-neutral-900">
                Useful shortcuts
              </h2>

              <div className="mt-4 grid gap-3">
                <Link
                  href="/issues/new"
                  className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                >
                  ➕ Create issue
                </Link>
                <Link
                  href="/dashboard/caretaker"
                  className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                >
                  🏠 Go to dashboard
                </Link>
                <Link
                  href="/inspections"
                  className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                >
                  📋 View inspections
                </Link>
              </div>
            </section>

            <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-neutral-500">
                Workflow Notes
              </p>
              <h2 className="mt-1 text-lg font-semibold text-neutral-900">
                Suggested process
              </h2>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-sm font-semibold text-neutral-900">
                    1. Log the issue
                  </p>
                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Capture title, property, unit, priority, and description.
                  </p>
                </div>

                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-sm font-semibold text-neutral-900">
                    2. Assign responsibility
                  </p>
                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Link the issue to caretaker, staff member, or contractor.
                  </p>
                </div>

                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-sm font-semibold text-neutral-900">
                    3. Track resolution
                  </p>
                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Move from open to in-progress to resolved with timestamps.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </section>

        <footer className="rounded-[24px] border border-black/5 bg-white/80 px-5 py-4 text-xs text-neutral-500 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>EstateDesk · Issues Management</p>
            <p>Professional maintenance and operations tracking</p>
          </div>
        </footer>
      </div>
    </div>
  );
}