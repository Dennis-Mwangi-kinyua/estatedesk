import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import type { OrgDashboardSummary } from "@/features/dashboard/server/get-org-dashboard-summary";
import { SectionCard, DASHBOARD_QUICK_LINKS } from "./org-dashboard-shared";

export function OrgDashboardHero({
  data,
  organizationName,
}: {
  data: OrgDashboardSummary;
  organizationName: string;
}) {
  return (
    <SectionCard className="overflow-hidden border-neutral-200 bg-white dark:border-white/10 dark:bg-slate-900/88">
      <div className="p-5 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:bg-white/10 dark:text-neutral-200">
              <LayoutGrid className="h-3.5 w-3.5" />
              Home
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-4xl">
              {organizationName} command center
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600 dark:text-neutral-300 sm:text-base">
              Jump into the workspace you need, then use the summary cards below
              to review portfolio health without crowding the homepage.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[300px]">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-800/70">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
                Occupancy
              </p>
              <p className="mt-2 text-2xl font-semibold text-neutral-950 dark:text-white">
                {data.occupancyRate}%
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-800/70">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
                Pending payments
              </p>
              <p className="mt-2 text-2xl font-semibold text-neutral-950 dark:text-white">
                {data.pendingPayments}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {DASHBOARD_QUICK_LINKS.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 transition hover:-translate-y-0.5 hover:border-neutral-300 hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-slate-800/70 dark:hover:border-white/20 dark:hover:bg-slate-800"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-950 dark:text-white">
                    {item.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-neutral-500 dark:text-neutral-300">
                    {item.description}
                  </p>
                </div>
                <item.icon className="h-4 w-4 shrink-0 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-neutral-700 dark:text-neutral-500 dark:group-hover:text-neutral-200" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
