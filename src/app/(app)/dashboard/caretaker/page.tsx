import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Sparkles,
  Users,
  Wrench,
  Droplets,
} from "lucide-react";

function SoftBadge({
  label,
}: {
  label: string;
}) {
  return (
    <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white/90 px-3 py-1 text-[11px] font-medium text-neutral-600 shadow-sm backdrop-blur">
      {label}
    </span>
  );
}

function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[24px] border border-neutral-200/80 bg-white/85 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl ${className}`}
    >
      {children}
    </section>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "neutral" | "blue" | "green" | "amber" | "rose";
}) {
  const tones = {
    neutral: "bg-neutral-100 text-neutral-700",
    blue: "bg-sky-50 text-sky-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  };

  return (
    <div className="rounded-[22px] border border-neutral-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-neutral-500">{hint}</p>
    </div>
  );
}

function QuickActionCard({
  href,
  title,
  subtitle,
  icon: Icon,
  tone = "neutral",
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "neutral" | "blue" | "green" | "amber" | "purple";
}) {
  const tones = {
    neutral: "bg-neutral-100 text-neutral-700",
    blue: "bg-sky-50 text-sky-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    purple: "bg-violet-50 text-violet-700",
  };

  return (
    <Link
      href={href}
      className="group block rounded-[22px] border border-neutral-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900">{title}</p>
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                {subtitle}
              </p>
            </div>

            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400 transition group-hover:text-neutral-700" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function ActivityItem({
  title,
  subtitle,
  icon: Icon,
  tone = "neutral",
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "neutral" | "green" | "amber" | "blue";
}) {
  const tones = {
    neutral: "bg-neutral-100 text-neutral-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-sky-50 text-sky-700",
  };

  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 transition hover:bg-neutral-50">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900">{title}</p>
          <p className="mt-1 text-xs text-neutral-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50 p-4">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">
        {value}
      </p>
    </div>
  );
}

export default function CaretakerDashboardPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <SectionCard className="p-5 sm:p-6">
        <div className="flex flex-wrap gap-2">
          <SoftBadge label="Operations" />
          <SoftBadge label="Caretaker" />
          <SoftBadge label="Mobile First" />
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-neutral-500">
            EstateDesk Workspace
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            Caretaker dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500 sm:text-base">
            Monitor issues, inspections, leases, tenants, and water billing in
            one calm, well-organized workspace.
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard/caretaker/issues"
            className="inline-flex items-center justify-center rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Open issues
          </Link>

          <Link
            href="/dashboard/caretaker/inspections"
            className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            View inspections
          </Link>
        </div>
      </SectionCard>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Assigned Buildings"
          value="12"
          hint="Buildings currently under your supervision."
          icon={Building2}
          tone="blue"
        />
        <StatCard
          label="Open Issues"
          value="08"
          hint="Maintenance requests awaiting attention."
          icon={AlertCircle}
          tone="amber"
        />
        <StatCard
          label="Completed Today"
          value="03"
          hint="Tasks marked complete during today’s workflow."
          icon={CheckCircle2}
          tone="green"
        />
        <StatCard
          label="Water Bills"
          value="11"
          hint="Bills currently pending verification or follow-up."
          icon={Droplets}
          tone="rose"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard className="p-4 sm:p-5 xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-neutral-500">
                Recent activity
              </p>
              <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
                Latest updates
              </h2>
            </div>

            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600">
              Today
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <ActivityItem
              icon={AlertCircle}
              title="Leakage issue reported in Block A"
              subtitle="Unit A-12 · 2 hours ago"
              tone="amber"
            />
            <ActivityItem
              icon={CheckCircle2}
              title="Inspection completed for Sunrise Apartments"
              subtitle="Today at 10:30 AM"
              tone="green"
            />
            <ActivityItem
              icon={ClipboardList}
              title="New inspection request submitted"
              subtitle="Block C · This morning"
              tone="blue"
            />
            <ActivityItem
              icon={Wrench}
              title="Maintenance follow-up scheduled"
              subtitle="Block B · Yesterday"
              tone="neutral"
            />
          </div>
        </SectionCard>

        <SectionCard className="p-4 sm:p-5">
          <p className="text-sm font-medium text-neutral-500">Quick actions</p>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
            Open a section
          </h2>

          <div className="mt-4 grid gap-3">
            <QuickActionCard
              href="/dashboard/caretaker/issues"
              title="Issues"
              subtitle="Review open maintenance and tenant concerns."
              icon={Wrench}
              tone="amber"
            />
            <QuickActionCard
              href="/dashboard/caretaker/inspections"
              title="Inspections"
              subtitle="Check scheduled inspections and reports."
              icon={ClipboardList}
              tone="blue"
            />
            <QuickActionCard
              href="/dashboard/caretaker/leases"
              title="Leases"
              subtitle="View lease records tied to your assignments."
              icon={FileText}
              tone="green"
            />
            <QuickActionCard
              href="/dashboard/caretaker/tenants"
              title="Tenants"
              subtitle="Access tenant information and communication."
              icon={Users}
              tone="purple"
            />
          </div>
        </SectionCard>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-neutral-500">
                Today’s focus
              </p>
              <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
                Priority tasks
              </h2>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50 p-4">
              <p className="text-sm font-semibold text-neutral-900">
                Review urgent maintenance tickets
              </p>
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Confirm status for plumbing, power, and water issues.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50 p-4">
              <p className="text-sm font-semibold text-neutral-900">
                Complete scheduled inspections
              </p>
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Capture notes, photos, and recommended follow-up work.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50 p-4">
              <p className="text-sm font-semibold text-neutral-900">
                Follow up on tenant requests
              </p>
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Make sure unresolved reports have updates or assignments.
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard className="p-4 sm:p-5">
          <div>
            <p className="text-sm font-medium text-neutral-500">
              Weekly snapshot
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
              Performance overview
            </h2>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniMetric label="Resolved Issues" value="14" />
            <MiniMetric label="Inspections Done" value="09" />
            <MiniMetric label="Pending Reviews" value="04" />
            <MiniMetric label="Tenant Requests" value="11" />
          </div>
        </SectionCard>
      </section>
    </div>
  );
}