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
import { panelBodyClassName, panelShellClassName, StatCard } from "./caretaker-ui";

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
    <section className={panelShellClassName}>
      <div className={`border-b border-border ${panelBodyClassName}`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              Field operations
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Welcome back, {firstName}
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              {attentionCount > 0
                ? `${attentionCount} item${attentionCount === 1 ? "" : "s"} need attention across issues, inspections, and water billing in your assigned scope.`
                : "Your queues are clear. Review assigned units and stay ready for field updates."}
            </p>

            <InAppGuideHint topic="caretaker" workspace="caretaker" />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/dashboard/caretaker/today"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-4 text-sm font-semibold text-foreground transition hover:bg-primary/10"
            >
              <ClipboardList className="h-4 w-4" />
              Today&apos;s work
            </Link>
            <Link
              href="/dashboard/caretaker/inspections"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              <ClipboardList className="h-4 w-4" />
              Inspections
            </Link>
            <Link
              href="/dashboard/caretaker/issues"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <Wrench className="h-4 w-4" />
              Open issues
            </Link>
          </div>
        </div>
      </div>

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
    </section>
  );
}