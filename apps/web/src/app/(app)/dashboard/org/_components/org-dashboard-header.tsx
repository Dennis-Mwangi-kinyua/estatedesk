import { WorkspaceHero } from "@/components/shared/workspace-hero";
import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { Lightbulb, UserPlus } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import type { OrgDashboardSummary } from "@/features/dashboard/server/get-org-dashboard-summary";
import { panelShellClassName } from "./org-dashboard-ui";

export function OrgDashboardHeader({
  data,
  organizationName,
  orgRole,
}: {
  data: OrgDashboardSummary;
  organizationName: string;
  orgRole?: OrgRole | null;
}) {
  const occupancyHighlight =
    data.occupancyRate >= 80
      ? "text-emerald-700 dark:text-emerald-200"
      : data.occupancyRate > 0
        ? "text-amber-700 dark:text-amber-200"
        : "text-foreground";

  const pendingHighlight =
    data.pendingPayments > 0
      ? "text-amber-700 dark:text-amber-200"
      : "text-foreground";

  const queueCount =
    data.pendingPayments +
    data.openIssues +
    data.pendingFinanceRequests +
    data.waterPendingApproval +
    data.expenditureApprovalsPending;

  return (
    <section data-workspace-header className={panelShellClassName}>
      <div>
        <WorkspaceHero kind="org" eyebrow={orgRole === "ADMIN" ? "Organisation overview" : "Your team workspace"} title={organizationName} description={queueCount > 0 ? `${queueCount} item${queueCount === 1 ? "" : "s"} need attention across payments, maintenance, finance, and operations.` : "Your portfolio queues are clear. Review occupancy, collections, and your next steps below."} actions={<>
          <Link data-workspace-action="true" href="/dashboard/org/insights" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium"><Lightbulb className="h-4 w-4" />Smart insights</Link>
          {orgRole !== "ACCOUNTANT" && <Link data-workspace-action="true" href="/dashboard/org/tenants/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><UserPlus className="h-4 w-4" />Add tenant</Link>}
        </>}><InAppGuideHint topic="portfolio" workspace="org" orgRole={orgRole} /></WorkspaceHero>

        <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
          <div className="workspace-metric rounded-2xl border border-border bg-muted/10 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Occupancy
            </p>
            <p className={`mt-2 text-2xl font-semibold ${occupancyHighlight}`}>
              {data.occupancyRate}%
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.vacantUnits} vacant unit{data.vacantUnits === 1 ? "" : "s"}
            </p>
          </div>
          <div className="workspace-metric rounded-2xl border border-border bg-muted/10 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Pending payments
            </p>
            <p className={`mt-2 text-2xl font-semibold ${pendingHighlight}`}>
              {data.pendingPayments}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Awaiting verification
            </p>
          </div>
          <div className="workspace-metric rounded-2xl border border-border bg-muted/10 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Open issues
            </p>
            <p
              className={`mt-2 text-2xl font-semibold ${
                data.urgentIssues > 0
                  ? "text-amber-700 dark:text-amber-200"
                  : "text-foreground"
              }`}
            >
              {data.openIssues}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.urgentIssues} urgent
            </p>
          </div>
          <div className="workspace-metric rounded-2xl border border-border bg-muted/10 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Finance queue
            </p>
            <p
              className={`mt-2 text-2xl font-semibold ${
                data.pendingFinanceRequests + data.expenditureApprovalsPending > 0
                  ? "text-amber-700 dark:text-amber-200"
                  : "text-foreground"
              }`}
            >
              {data.pendingFinanceRequests + data.expenditureApprovalsPending}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Requests and spend approvals
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}