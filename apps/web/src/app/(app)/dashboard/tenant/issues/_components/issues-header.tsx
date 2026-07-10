import Link from "next/link";
import { SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import { Plus } from "lucide-react";
import type { TenantIssuesPageData } from "@/app/(app)/dashboard/tenant/issues/_lib/types";

export function IssuesHeader({ data }: { data: TenantIssuesPageData }) {
  const { primaryUnit } = data;

  return (
    <SurfaceCard className="p-5 sm:p-6 lg:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Tenant Support
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">
            My Issues
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Track maintenance requests and issue tickets for your unit,
            including status, priority, and resolution notes.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="ed-theme-muted-panel rounded-[24px] px-4 py-4 sm:px-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Current Unit
            </p>
            <p className="mt-1 text-base font-semibold text-foreground">
              {primaryUnit
                ? `${primaryUnit.property.name} — ${primaryUnit.houseNo}`
                : "N/A"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {primaryUnit?.building?.name ?? "No building"}
            </p>
          </div>

          <Link
            href="/dashboard/tenant/issues/report"
            className="inline-flex items-center justify-center rounded-[16px] bg-neutral-900 px-4 py-3 text-sm font-medium text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Report Issue
          </Link>
        </div>
      </div>
    </SurfaceCard>
  );
}