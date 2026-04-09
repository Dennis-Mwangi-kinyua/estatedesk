import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  ClipboardList,
  Download,
  FileText,
  Home,
  Receipt,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

const reportCards = [
  {
    title: "Rent Collection",
    description: "Track rent billed, paid, overdue balances, and collection performance.",
    icon: Receipt,
    href: "/platform/reports/rent-collection",
  },
  {
    title: "Occupancy",
    description: "Review occupied, vacant, reserved, and inactive units across properties.",
    icon: Home,
    href: "/platform/reports/occupancy",
  },
  {
    title: "Operations",
    description: "Summaries for issues, inspections, maintenance, and move-out activity.",
    icon: ClipboardList,
    href: "/platform/reports/operations",
  },
  {
    title: "Organizations",
    description: "Analyze organization growth, activity, onboarding, and workspace usage.",
    icon: Building2,
    href: "/platform/reports/organizations",
  },
  {
    title: "Financial Reports",
    description: "View payment trends, exports, reconciliations, and revenue snapshots.",
    icon: TrendingUp,
    href: "/platform/reports/financials",
  },
  {
    title: "Exports",
    description: "Generate downloadable reports and export structured operational data.",
    icon: Download,
    href: "/platform/reports/exports",
  },
] as const;

export default function ReportsPage() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b border-neutral-200 px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
              Platform
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
              Reports
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-neutral-500">
              View analytics, exports, and operational reports across the platform.
            </p>
          </div>

          <Link
            href="/platform"
            className="inline-flex items-center gap-2 self-start rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_0.9fr]">
          <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50">
                <BarChart3 className="h-5 w-5 text-neutral-800" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-neutral-950 sm:text-lg">
                  Available Reports
                </h2>
                <p className="text-sm text-neutral-500">
                  Choose a report category to review platform activity.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2">
              {reportCards.map((report) => {
                const Icon = report.icon;

                return (
                  <Link
                    key={report.title}
                    href={report.href}
                    className="group rounded-3xl border border-neutral-200 bg-neutral-50 p-4 transition hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-neutral-200 bg-white">
                        <Icon className="h-5 w-5 text-neutral-800" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-neutral-950 sm:text-base">
                          {report.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-neutral-500">
                          {report.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50">
                  <FileText className="h-5 w-5 text-neutral-800" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-neutral-950">
                    Reports Summary
                  </h2>
                  <p className="text-sm text-neutral-500">
                    Quick overview of what this area supports.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <SummaryRow label="Analytics" value="Ready" />
                <SummaryRow label="Exports" value="Ready" />
                <SummaryRow label="Operational Reports" value="Ready" />
                <SummaryRow label="Database Wiring" value="Next Step" />
              </div>
            </section>

            <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="text-base font-semibold text-neutral-950">
                Next Step
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                This page is set up with a professional mobile-first layout. The
                next step is wiring each report card to real queries, charts,
                filters, and export actions.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm font-medium text-neutral-900">{value}</span>
    </div>
  );
}