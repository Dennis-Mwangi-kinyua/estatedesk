import Link from "next/link";
import type { CaretakerDashboardStats } from "@/app/(app)/dashboard/caretaker/_lib/types";
import {
  FocusTaskCard,
  panelBodyClassName,
  panelShellClassName,
} from "./caretaker-ui";

export function CaretakerDashboardFocusSection({
  data,
}: {
  data: CaretakerDashboardStats;
}) {
  return (
    <section className={panelShellClassName}>
      <div
        className={`flex items-center justify-between gap-3 border-b border-border ${panelBodyClassName}`}
      >
        <div>
          <p className="text-sm text-muted-foreground">Today&apos;s focus</p>
          <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Priority tasks
          </h2>
        </div>


      </div>

      <div className={`space-y-3 ${panelBodyClassName}`}>
        <Link data-workspace-action="true"
          href="/dashboard/caretaker/today"
          className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Open today&apos;s work
        </Link>
        <FocusTaskCard
          title="Review urgent maintenance tickets"
          description={`${data.urgentIssues.toLocaleString()} urgent ticket${
            data.urgentIssues === 1 ? "" : "s"
          } currently need a status update.`}
        />
        <FocusTaskCard
          title="Complete scheduled inspections"
          description={`${data.scheduledInspections.toLocaleString()} inspection${
            data.scheduledInspections === 1 ? "" : "s"
          } scheduled for your assigned apartments.`}
        />
        <FocusTaskCard
          title="Follow up on active tenants"
          description={`${data.activeTenants.toLocaleString()} active tenant${
            data.activeTenants === 1 ? "" : "s"
          } across ${data.activeLeases.toLocaleString()} active lease${
            data.activeLeases === 1 ? "" : "s"
          }.`}
        />
      </div>
    </section>
  );
}