import type { ComponentType } from "react";
import { DeferredLink } from "@/components/navigation/app-links";
import {
  ArrowRight,
  BellRing,
  CircleAlert,
  ClipboardCheck,
  ClipboardList,
  Droplets,
  FileText,
  Inbox,
  Landmark,
  Lightbulb,
  LogOut,
  Receipt,
  Wallet,
} from "lucide-react";
import type { OrgDashboardSummary } from "@/features/dashboard/server/get-org-dashboard-summary";
import { panelShellClassName } from "./org-dashboard-ui";

type Signal = {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  icon: ComponentType<{ className?: string }>;
  accent: boolean;
  count?: number;
};

function buildSignals(data: OrgDashboardSummary): Signal[] {
  return [
    {
      title: "Smart insights",
      description:
        data.pendingPayments > 0 || data.openIssues > 0
          ? "Exceptions detected — review ranked actions."
          : "Operating within current rules.",
      href: "/dashboard/org/insights",
      actionLabel: "Insights",
      icon: Lightbulb,
      accent: data.pendingPayments > 0 || data.urgentIssues > 0,
    },
    {
      title: "Payments",
      description:
        data.pendingPayments > 0
          ? `${data.pendingPayments} awaiting verification`
          : "No pending verifications",
      href: "/dashboard/org/payments",
      actionLabel: "Payments",
      icon: Wallet,
      accent: data.pendingPayments > 0,
      count: data.pendingPayments,
    },
    {
      title: "Maintenance",
      description:
        data.openIssues > 0
          ? `${data.openIssues} open${data.urgentIssues > 0 ? `, ${data.urgentIssues} urgent` : ""}`
          : "No open issues",
      href: "/dashboard/org/issues",
      actionLabel: "Issues",
      icon: CircleAlert,
      accent: data.urgentIssues > 0,
      count: data.openIssues,
    },
    {
      title: "Completion reports",
      description:
        data.pendingResolutionReports > 0
          ? `${data.pendingResolutionReports} awaiting review`
          : "Queue clear",
      href: "/dashboard/org/issues/resolution-reports",
      actionLabel: "Reports",
      icon: ClipboardList,
      accent: data.pendingResolutionReports > 0,
      count: data.pendingResolutionReports,
    },
    {
      title: "Finance requests",
      description:
        data.pendingFinanceRequests > 0
          ? `${data.pendingFinanceRequests} tickets in queue`
          : "No pending tickets",
      href: "/dashboard/org/accounting/requests",
      actionLabel: "Requests",
      icon: Inbox,
      accent: data.pendingFinanceRequests > 0,
      count: data.pendingFinanceRequests,
    },
    {
      title: "Accounting",
      description: !data.accountingInitialized
        ? "Setup required"
        : data.openPayables > 0 || data.unpostedPayments > 0
          ? [
              data.openPayables > 0 ? `${data.openPayables} payables` : null,
              data.unpostedPayments > 0
                ? `${data.unpostedPayments} unposted`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")
          : "Ledger healthy",
      href: "/dashboard/org/accounting",
      actionLabel: "Accounting",
      icon: Landmark,
      accent:
        !data.accountingInitialized ||
        data.openPayables > 0 ||
        data.unpostedPayments > 0,
    },
    {
      title: "Expenditures",
      description:
        data.expenditureApprovalsPending > 0 ||
        data.approvedExpendituresAwaitingPayment > 0
          ? [
              data.expenditureApprovalsPending > 0
                ? `${data.expenditureApprovalsPending} to approve`
                : null,
              data.approvedExpendituresAwaitingPayment > 0
                ? `${data.approvedExpendituresAwaitingPayment} to pay`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")
          : "No pending spend",
      href: "/dashboard/org/expenditures",
      actionLabel: "Spend",
      icon: Receipt,
      accent:
        data.expenditureApprovalsPending > 0 ||
        data.approvedExpendituresAwaitingPayment > 0,
    },
    {
      title: "Water bills",
      description:
        data.waterPendingApproval > 0
          ? `${data.waterPendingApproval} readings to approve`
          : "No pending approvals",
      href: "/dashboard/org/water-bills",
      actionLabel: "Water",
      icon: Droplets,
      accent: data.waterPendingApproval > 0,
      count: data.waterPendingApproval,
    },
    {
      title: "Vacancy leads",
      description:
        data.vacancyInquiries > 0
          ? `${data.vacancyInquiries} new enquir${data.vacancyInquiries === 1 ? "y" : "ies"}`
          : "No new leads",
      href: "/dashboard/org/vacancy-inquiries",
      actionLabel: "Leads",
      icon: BellRing,
      accent: data.vacancyInquiries > 0,
      count: data.vacancyInquiries,
    },
    {
      title: "Move-outs",
      description:
        data.moveOutQueueCount > 0 || data.overdueInspections > 0
          ? `${data.moveOutQueueCount} active${data.overdueInspections > 0 ? `, ${data.overdueInspections} overdue` : ""}`
          : data.scheduledInspections > 0
            ? `${data.scheduledInspections} inspections scheduled`
            : "Pipeline clear",
      href: "/dashboard/org/move-outs",
      actionLabel: "Move-outs",
      icon: LogOut,
      accent: data.overdueInspections > 0 || data.moveOutQueueCount > 0,
      count: data.moveOutQueueCount,
    },
    {
      title: "Inspections",
      description:
        data.scheduledInspections > 0 || data.overdueInspections > 0
          ? `${data.scheduledInspections} scheduled${data.overdueInspections > 0 ? `, ${data.overdueInspections} overdue` : ""}`
          : "Nothing scheduled",
      href: "/dashboard/org/inspections",
      actionLabel: "Calendar",
      icon: ClipboardCheck,
      accent: data.overdueInspections > 0,
    },
    {
      title: "Lease renewals",
      description:
        data.leaseExpiring30Days > 0
          ? `${data.leaseExpiring30Days} in 30 days`
          : data.leaseExpiring60Days > 0
            ? `${data.leaseExpiring60Days} in 60 days`
            : "None expiring soon",
      href: "/dashboard/org/leases",
      actionLabel: "Leases",
      icon: FileText,
      accent: data.leaseExpiring30Days > 0,
      count: data.leaseExpiring30Days,
    },
    {
      title: "Tax desk",
      description:
        data.pendingTaxCharges > 0
          ? `${data.pendingTaxCharges} pending charges`
          : "No pending tax work",
      href: "/dashboard/org/taxes",
      actionLabel: "Taxes",
      icon: Receipt,
      accent: data.pendingTaxCharges > 0,
      count: data.pendingTaxCharges,
    },
  ];
}

export function OrgDashboardSnapshot({ data }: { data: OrgDashboardSummary }) {
  const signals = buildSignals(data);
  // Needs-attention first so the grid isn't a wall of equal noise
  const ordered = [
    ...signals.filter((s) => s.accent),
    ...signals.filter((s) => !s.accent),
  ];
  const attentionCount = signals.filter((s) => s.accent).length;

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Operations overview
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Queues across finance, maintenance, and the tenant lifecycle.
            </p>
          </div>
          {attentionCount > 0 ? (
            <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              {attentionCount} need{attentionCount === 1 ? "s" : ""} attention
            </span>
          ) : (
            <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              All clear
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-2 xl:grid-cols-3 xl:gap-4 xl:p-6">
        {ordered.map((signal) => (
          <DeferredLink
            key={signal.title}
            href={signal.href}
            className={`group flex min-h-[9.5rem] flex-col rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm sm:min-h-[10rem] sm:p-4 ${
              signal.accent
                ? "border-amber-200 bg-amber-50/80 hover:border-amber-300 dark:border-amber-500/30 dark:bg-amber-500/10"
                : "border-border bg-muted/10 hover:border-border/80 hover:bg-muted/15"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                  signal.accent
                    ? "border-amber-200 bg-background text-amber-800 dark:border-amber-500/30 dark:text-amber-200"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                <signal.icon className="h-4 w-4" />
              </div>
              {typeof signal.count === "number" && signal.count > 0 ? (
                <span className="inline-flex min-w-[1.75rem] items-center justify-center rounded-full bg-amber-900 px-2 py-0.5 text-xs font-bold text-white dark:bg-amber-400 dark:text-amber-950">
                  {signal.count}
                </span>
              ) : null}
            </div>

            <div className="mt-3 min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{signal.title}</p>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                {signal.description}
              </p>
            </div>

            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
              {signal.actionLabel}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </DeferredLink>
        ))}
      </div>
    </section>
  );
}
