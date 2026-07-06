import Link from "next/link";
import { Bell, ExternalLink } from "lucide-react";
import { formatNumber } from "../_lib/helpers";
import type { PlatformDashboardData } from "../_lib/queries";

export function PlatformDashboardAlert({
  newOnboardingCount,
  recentOnboardingRequests,
}: Pick<PlatformDashboardData, "newOnboardingCount" | "recentOnboardingRequests">) {
  if (newOnboardingCount <= 0) {
    return null;
  }

  return (
    <Link
      href="/platform/onboarding?status=NEW"
      className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-sm transition hover:border-amber-400 hover:bg-amber-100 dark:border-amber-400/50 dark:bg-amber-950 dark:text-amber-50 dark:shadow-[0_0_0_1px_rgba(251,191,36,0.15)] dark:hover:border-amber-300/70 dark:hover:bg-amber-900 sm:flex-row sm:items-center sm:justify-between"
    >
      <span className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-200 text-amber-900 dark:bg-amber-400/20 dark:text-amber-100">
          <Bell className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-amber-950 dark:text-amber-50">
            {formatNumber(newOnboardingCount)} new onboarding request
            {newOnboardingCount === 1 ? "" : "s"} need attention
          </span>
          <span className="mt-1 block text-sm text-amber-900/80 dark:text-amber-100/90">
            Latest: {recentOnboardingRequests[0]?.companyName ?? "New company"} from{" "}
            {recentOnboardingRequests[0]?.fullName ?? "a new contact"}.
          </span>
        </span>
      </span>
      <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-amber-900 px-3 text-xs font-semibold text-white dark:bg-amber-400 dark:text-amber-950">
        Review queue
        <ExternalLink className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}