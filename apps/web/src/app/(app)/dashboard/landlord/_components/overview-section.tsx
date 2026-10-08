import Link from "next/link";
import { WorkspaceHero } from "@/components/shared/workspace-hero";
import { BarChart3 } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import {
  formatCurrency,
  formatPercent,
} from "@/app/(app)/dashboard/landlord/_lib/helpers";
import type { LandlordDashboardData } from "@/app/(app)/dashboard/landlord/_lib/types";

export function OverviewSection({
  data,
}: {
  data: LandlordDashboardData;
}) {
  return (
    <section id="overview" className="workspace-panel overflow-hidden rounded-3xl border border-border bg-card">
      <div className="space-y-0">
        <WorkspaceHero kind="landlord" eyebrow="Your landlord workspace" title={`Welcome back, ${data.displayName}`} description="A clear view of your mapped properties, occupancy, rent collections, and open balances." actions={<><Link data-workspace-action="true" href="/dashboard/landlord/statements" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">View statements</Link><Link data-workspace-action="true" href="/dashboard/landlord/payouts" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-medium">Review payouts</Link></>}><InAppGuideHint topic="rent" workspace="landlord" orgRole="LANDLORD" /></WorkspaceHero>

        <div className="m-5 rounded-2xl border border-border bg-muted/20 p-4 sm:m-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-neutral-500">
                Collection rate
              </p>
              <p className="mt-1 text-3xl font-bold text-neutral-950">
                {formatPercent(data.collectionRate)}
              </p>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-950 text-white">
              <BarChart3 className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white ring-1 ring-neutral-200">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${Math.min(data.collectionRate, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            {formatCurrency(data.monthlyAmountPaid)} received from{" "}
            {formatCurrency(data.monthlyAmountDue)} expected.
          </p>
        </div>
      </div>
    </section>
  );
}