import { WorkspaceHero } from "@/components/shared/workspace-hero";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ClipboardList,
  Droplets,
  Wrench,
} from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { CARETAKER_DASHBOARD_WORKFLOW } from "../_lib/constants";
import type { CaretakerDashboardData } from "../_lib/types";
import { panelShellClassName, StatCard } from "./caretaker-ui";

type CaretakerDashboardHeaderProps = {
  data: CaretakerDashboardData;
  fullName: string;
};

export function CaretakerDashboardHeader({
  data,
  fullName,
}: CaretakerDashboardHeaderProps) {
  const attentionCount =
    data.openIssues + data.pendingWaterBills + data.scheduledInspections;

  const firstName = fullName.trim().split(/\s+/)[0] || "Caretaker";

  return (
    <section data-workspace-header className={panelShellClassName}>
      <WorkspaceHero kind="caretaker" eyebrow="Field operations" title={`Welcome back, ${firstName}`} description={attentionCount > 0 ? `${attentionCount} item${attentionCount === 1 ? "" : "s"} need attention across issues, inspections, and water billing in your assigned scope.` : "Your queues are clear. Review assigned units and stay ready for field updates."} actions={<>
          <Link href="/dashboard/caretaker/today" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><ClipboardList className="h-4 w-4" />Today’s work</Link>
          <Link href="/dashboard/caretaker/inspections" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium"><ClipboardList className="h-4 w-4" />Inspections</Link>
          <Link href="/dashboard/caretaker/issues" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium"><Wrench className="h-4 w-4" />Open issues</Link>
        </>}><InAppGuideHint topic="caretaker" workspace="caretaker" /></WorkspaceHero>

      <div className="grid gap-3 border-b border-border px-5 py-5 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
        <StatCard
          label="Assigned units"
          value={data.assignedUnits}
          note="Apartments currently under your care"
          icon={Building2}
          href="/dashboard/caretaker/leases"
        />
        <StatCard
          label="Open issues"
          value={data.openIssues}
          note={`${data.urgentIssues} urgent need attention`}
          icon={AlertCircle}
          highlight={data.urgentIssues > 0 ? "warning" : "default"}
          href="/dashboard/caretaker/issues"
        />
        <StatCard
          label="Completed today"
          value={data.resolvedToday}
          note={`${data.completedInspectionsToday} inspection${data.completedInspectionsToday === 1 ? "" : "s"} completed`}
          icon={CheckCircle2}
          highlight={data.resolvedToday > 0 ? "success" : "default"}
        />
        <StatCard
          label="Water bills"
          value={data.pendingWaterBills}
          note="Pending verification or follow-up"
          icon={Droplets}
          highlight={data.pendingWaterBills > 0 ? "warning" : "default"}
          href="/dashboard/caretaker/water-bills"
        />
      </div>

      <details className="border-t border-border">
        <summary className="flex min-h-12 cursor-pointer items-center gap-2 px-5 text-sm font-medium text-muted-foreground sm:px-6">💡 How this works</summary>
<div className="grid gap-3 px-5 py-5 sm:grid-cols-3 sm:px-6">
        {CARETAKER_DASHBOARD_WORKFLOW.map((item) => (
          <div
            key={item.step}
            className="rounded-2xl border border-border bg-muted/15 p-4"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {item.step}
              </span>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
          </div>
        ))}
      </div>
      </details>
    </section>
  );
}