import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { LayoutGrid, Lightbulb, UserPlus } from "lucide-react";
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
    <section className={panelShellClassName}>
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <LayoutGrid className="h-3.5 w-3.5" />
              Home
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {organizationName} command center
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              {queueCount > 0
                ? `${queueCount} item${queueCount === 1 ? "" : "s"} need attention across payments, maintenance, finance, and operations.`
                : "Portfolio queues are clear. Use the snapshot below to review health signals."}
            </p>

            <InAppGuideHint topic="portfolio" workspace="org" orgRole={orgRole} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
            <Link
              href="/dashboard/org/insights"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              <Lightbulb className="h-4 w-4" />
              Smart insights
            </Link>
            {orgRole !== "ACCOUNTANT" ? (
              <Link
                href="/dashboard/org/tenants/new"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                <UserPlus className="h-4 w-4" />
                Add tenant
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
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
          <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
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
          <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
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
          <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
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