import Link from "next/link";

function Sticker({
  emoji,
  label,
}: {
  emoji: string;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm backdrop-blur">
      <span className="text-sm">{emoji}</span>
      <span>{label}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  emoji,
}: {
  label: string;
  value: string;
  hint: string;
  emoji: string;
}) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">
            {value}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-2xl">
          {emoji}
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-neutral-500">{hint}</p>
    </div>
  );
}

function ActivityItem({
  title,
  meta,
  emoji,
}: {
  title: string;
  meta: string;
  emoji: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 transition hover:bg-neutral-50">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-xl">
        {emoji}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-neutral-900">{title}</p>
        <p className="mt-1 text-xs text-neutral-500">{meta}</p>
      </div>
    </div>
  );
}

function ActionCard({
  href,
  title,
  subtitle,
  emoji,
}: {
  href: string;
  title: string;
  subtitle: string;
  emoji: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-2xl transition group-hover:bg-neutral-900 group-hover:text-white">
          {emoji}
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900">{title}</p>
          <p className="mt-1 text-xs leading-5 text-neutral-500">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}

export default function CaretakerDashboardPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-neutral-200 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 p-5 text-white shadow-sm sm:p-6">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

        <div className="relative">
          <div className="flex flex-wrap gap-2">
            <Sticker emoji="🛠️" label="Daily Operations" />
            <Sticker emoji="🏢" label="Property Care" />
            <Sticker emoji="📱" label="Mobile Ready" />
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium text-neutral-300">
              Caretaker Workspace
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Keep buildings, tenants, and maintenance running smoothly.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-300 sm:text-base">
              Track issues, inspections, leases, and tenant activity from one
              clean dashboard designed for fast daily work.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/issues"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
            >
              View Issues
            </Link>
            <Link
              href="/inspections"
              className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
            >
              Start Inspection
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Assigned Buildings"
          value="12"
          hint="Buildings currently under your supervision."
          emoji="🏢"
        />
        <StatCard
          label="Open Issues"
          value="8"
          hint="Maintenance and tenant concerns awaiting action."
          emoji="🚨"
        />
        <StatCard
          label="Due Inspections"
          value="5"
          hint="Inspections scheduled and pending completion."
          emoji="📝"
        />
        <StatCard
          label="Active Leases"
          value="24"
          hint="Occupied units you actively support."
          emoji="🔑"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-neutral-500">
                Recent Activity
              </p>
              <h2 className="text-lg font-bold tracking-tight text-neutral-900">
                What needs your attention
              </h2>
            </div>
            <div className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
              Live Feed
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <ActivityItem
              emoji="💧"
              title="Water leakage reported in Block A"
              meta="Unit A-12 · 2 hours ago"
            />
            <ActivityItem
              emoji="✅"
              title="Inspection completed for Sunrise Apartments"
              meta="Today at 10:30 AM"
            />
            <ActivityItem
              emoji="⚡"
              title="Tenant complaint logged for power outage"
              meta="Block C · Yesterday"
            />
            <ActivityItem
              emoji="🧹"
              title="Common area cleaning marked complete"
              meta="Block B · Yesterday"
            />
          </div>
        </div>

        <div className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-sm font-medium text-neutral-500">Quick Actions</p>
          <h2 className="text-lg font-bold tracking-tight text-neutral-900">
            Jump into work
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-3">
            <ActionCard
              href="/issues"
              title="View Issues"
              subtitle="Review and follow up on open maintenance requests."
              emoji="🛠️"
            />
            <ActionCard
              href="/inspections"
              title="Open Inspections"
              subtitle="Check scheduled inspections and submit reports."
              emoji="📋"
            />
            <ActionCard
              href="/leases"
              title="Review Leases"
              subtitle="See active lease records linked to your work."
              emoji="📄"
            />
            <ActionCard
              href="/tenants"
              title="Manage Tenants"
              subtitle="Access tenant-related information quickly."
              emoji="🙂"
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">
                Today’s Focus
              </p>
              <h2 className="text-lg font-bold tracking-tight text-neutral-900">
                Priority tasks
              </h2>
            </div>
            <div className="text-2xl">🎯</div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm font-semibold text-neutral-900">
                Follow up on 3 urgent maintenance tickets
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Plumbing, electricity, and water pressure issues.
              </p>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm font-semibold text-neutral-900">
                Complete scheduled inspection for 2 buildings
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Capture notes, photos, and any follow-up work needed.
              </p>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm font-semibold text-neutral-900">
                Review tenant complaints submitted this week
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Make sure all reports have updates or assignments.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">
                Performance Snapshot
              </p>
              <h2 className="text-lg font-bold tracking-tight text-neutral-900">
                Weekly momentum
              </h2>
            </div>
            <div className="text-2xl">📈</div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs font-medium text-emerald-700">
                Resolved Issues
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-900">14</p>
            </div>

            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-xs font-medium text-blue-700">
                Inspections Done
              </p>
              <p className="mt-2 text-2xl font-bold text-blue-900">9</p>
            </div>

            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-xs font-medium text-amber-700">
                Pending Reviews
              </p>
              <p className="mt-2 text-2xl font-bold text-amber-900">4</p>
            </div>

            <div className="rounded-2xl bg-purple-50 p-4">
              <p className="text-xs font-medium text-purple-700">
                Tenant Requests
              </p>
              <p className="mt-2 text-2xl font-bold text-purple-900">11</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}