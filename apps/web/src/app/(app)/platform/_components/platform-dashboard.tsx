import Link from "next/link";
import { OnboardingRequestPopup } from "./onboarding-request-popup";
import type { PlatformDashboardData } from "../_lib/queries";
import { PlatformDashboardAlert } from "./platform-dashboard-alert";
import { PlatformDashboardAside } from "./platform-dashboard-aside";
import { PlatformDashboardMetrics } from "./platform-dashboard-metrics";
import { PlatformDashboardRecent } from "./platform-dashboard-recent";

export function PlatformDashboard({ data }: { data: PlatformDashboardData }) {
  const { newOnboardingCount, recentOnboardingRequests } = data;

  return (
    <div className="platform-glass-dashboard min-h-full text-slate-900 dark:text-slate-100">
      <OnboardingRequestPopup
        count={newOnboardingCount}
        latestRequestId={recentOnboardingRequests[0]?.id ?? null}
        latestCompany={recentOnboardingRequests[0]?.companyName ?? null}
      />
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-3 py-4 sm:px-4 lg:px-6 lg:py-6">
        <section className="platform-glass-hero relative overflow-hidden rounded-3xl border border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-5 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-emerald-950/40 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-sky-700 dark:text-sky-300">Your admin workspace</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">A clear view. A lighter day.</h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">Keep your people, organizations, and payments moving. Pick a task to get started.</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { emoji: "🏢", label: "Add organization", href: "/platform/organizations/new" },
              { emoji: "👋", label: "Review onboarding", href: "/platform/onboarding?status=NEW" },
              { emoji: "💸", label: "View payments", href: "/platform/payments" },
              { emoji: "🔎", label: "Search platform", href: "/platform/search" },
            ].map((action) => <Link key={action.href} href={action.href} className="platform-glass-shortcut flex min-h-14 items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-3 text-sm font-semibold shadow-sm transition hover:border-sky-300 hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-sky-500 motion-safe:active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"><span aria-hidden="true" className="text-xl">{action.emoji}</span><span>{action.label}</span></Link>)}
          </div>
        </section>
        <PlatformDashboardAlert
          newOnboardingCount={newOnboardingCount}
          recentOnboardingRequests={recentOnboardingRequests}
        />

        <PlatformDashboardMetrics data={data} />

        <div className="grid gap-5 xl:grid-cols-[290px_minmax(0,1fr)]">
          <PlatformDashboardAside data={data} />
          <PlatformDashboardRecent data={data} />
        </div>
      </div>
    </div>
  );
}
