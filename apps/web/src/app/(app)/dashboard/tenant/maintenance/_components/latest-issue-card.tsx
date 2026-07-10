import { SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import { getPriorityClasses, getStatusClasses } from "../_lib/helpers";
import type { TenantMaintenancePageData } from "../_lib/types";

export function LatestIssueCard({ data }: { data: TenantMaintenancePageData }) {
  const latestIssue = data.latestIssue;

  if (!latestIssue) {
    return null;
  }

  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Latest Issue
          </p>
          <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-foreground">
            {latestIssue.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {latestIssue.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${getStatusClasses(
              latestIssue.status,
            )}`}
          >
            {latestIssue.status.replaceAll("_", " ")}
          </span>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${getPriorityClasses(
              latestIssue.priority,
            )}`}
          >
            {latestIssue.priority}
          </span>
        </div>
      </div>
    </SurfaceCard>
  );
}