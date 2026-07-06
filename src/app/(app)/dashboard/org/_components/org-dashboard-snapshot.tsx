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
  icon: React.ComponentType<{ className?: string }>;
  accent: boolean;
};

export function OrgDashboardSnapshot({ data }: { data: OrgDashboardSummary }) {
  const signals: Signal[] = [
    {
      title: "Smart insights",
      description:
        data.pendingPayments > 0 || data.openIssues > 0
          ? "Exceptions detected — review ranked operational actions."
          : "Portfolio is operating within current rules.",
      href: "/dashboard/org/insights",
      actionLabel: "Open insights",
      icon: Lightbulb,
      accent: data.pendingPayments > 0 || data.urgentIssues > 0,
    },
    {
      title: "Payments queue",
      description:
        data.pendingPayments > 0
          ? `${data.pendingPayments} payment${data.pendingPayments === 1 ? "" : "s"} awaiting verification.`
          : "No pending payment verifications right now.",
      href: "/dashboard/org/payments",
      actionLabel: "Open payments",
      icon: Wallet,
      accent: data.pendingPayments > 0,
    },
    {
      title: "Maintenance queue",
      description:
        data.openIssues > 0
          ? `${data.openIssues} open issue${data.openIssues === 1 ? "" : "s"}${data.urgentIssues > 0 ? `, ${data.urgentIssues} urgent` : ""}.`
          : "No open maintenance issues right now.",
      href: "/dashboard/org/issues",
      actionLabel: "Open issues",
      icon: CircleAlert,
      accent: data.urgentIssues > 0,
    },
    {
      title: "Completion reports",
      description:
        data.pendingResolutionReports > 0
          ? `${data.pendingResolutionReports} caretaker report${data.pendingResolutionReports === 1 ? "" : "s"} awaiting office review.`
          : "No caretaker completion reports waiting for review.",
      href: "/dashboard/org/issues/resolution-reports",
      actionLabel: "Open report queue",
      icon: ClipboardList,
      accent: data.pendingResolutionReports > 0,
    },
    {
      title: "Finance requests",
      description:
        data.pendingFinanceRequests > 0
          ? `${data.pendingFinanceRequests} worker ticket${data.pendingFinanceRequests === 1 ? "" : "s"} awaiting accounts review.`
          : "No pending finance request tickets.",
      href: "/dashboard/org/accounting/requests",
      actionLabel: "Open request desk",
      icon: Inbox,
      accent: data.pendingFinanceRequests > 0,
    },
    {
      title: "Accounting & payables",
      description: !data.accountingInitialized
        ? "Chart of accounts not initialized — set up accounting first."
        : data.openPayables > 0 || data.unpostedPayments > 0
          ? [
              data.openPayables > 0
                ? `${data.openPayables} open payable${data.openPayables === 1 ? "" : "s"}`
                : null,
              data.unpostedPayments > 0
                ? `${data.unpostedPayments} unposted payment${data.unpostedPayments === 1 ? "" : "s"}`
                : null,
            ]
              .filter(Boolean)
              .join(", ") + " awaiting ledger action."
          : "Ledger is initialized with no open payables.",
      href: "/dashboard/org/accounting",
      actionLabel: "Open accounting",
      icon: Landmark,
      accent:
        !data.accountingInitialized ||
        data.openPayables > 0 ||
        data.unpostedPayments > 0,
    },
    {
      title: "Expenditure approvals",
      description:
        data.expenditureApprovalsPending > 0 ||
        data.approvedExpendituresAwaitingPayment > 0
          ? [
              data.expenditureApprovalsPending > 0
                ? `${data.expenditureApprovalsPending} awaiting approval`
                : null,
              data.approvedExpendituresAwaitingPayment > 0
                ? `${data.approvedExpendituresAwaitingPayment} approved awaiting payment`
                : null,
            ]
              .filter(Boolean)
              .join(", ") + "."
          : "No pending expenditure approvals.",
      href: "/dashboard/org/expenditures",
      actionLabel: "Review expenditures",
      icon: Receipt,
      accent:
        data.expenditureApprovalsPending > 0 ||
        data.approvedExpendituresAwaitingPayment > 0,
    },
    {
      title: "Water approvals",
      description:
        data.waterPendingApproval > 0
          ? `${data.waterPendingApproval} meter reading${data.waterPendingApproval === 1 ? "" : "s"} awaiting approval.`
          : "No pending water bill approvals.",
      href: "/dashboard/org/water-bills",
      actionLabel: "Open water desk",
      icon: Droplets,
      accent: data.waterPendingApproval > 0,
    },
    {
      title: "Vacancy leads",
      description:
        data.vacancyInquiries > 0
          ? `${data.vacancyInquiries} new vacancy enquir${data.vacancyInquiries === 1 ? "y" : "ies"} waiting for follow-up.`
          : "No new public vacancy enquiries right now.",
      href: "/dashboard/org/vacancy-inquiries",
      actionLabel: "Open inquiry desk",
      icon: BellRing,
      accent: data.vacancyInquiries > 0,
    },
    {
      title: "Move-outs & inspections",
      description:
        data.moveOutQueueCount > 0 || data.overdueInspections > 0
          ? `${data.moveOutQueueCount} active move-out${data.moveOutQueueCount === 1 ? "" : "s"}${data.overdueInspections > 0 ? `, ${data.overdueInspections} overdue inspection${data.overdueInspections === 1 ? "" : "s"}` : ""}.`
          : data.scheduledInspections > 0
            ? `${data.scheduledInspections} inspection${data.scheduledInspections === 1 ? "" : "s"} scheduled.`
            : "No active move-out or inspection work.",
      href: "/dashboard/org/move-outs",
      actionLabel: "Open move-outs",
      icon: LogOut,
      accent: data.overdueInspections > 0 || data.moveOutQueueCount > 0,
    },
    {
      title: "Inspection schedule",
      description:
        data.scheduledInspections > 0 || data.overdueInspections > 0
          ? `${data.scheduledInspections} scheduled${data.overdueInspections > 0 ? `, ${data.overdueInspections} overdue` : ""}.`
          : "No inspections on the calendar.",
      href: "/dashboard/org/inspections",
      actionLabel: "Open inspections",
      icon: ClipboardCheck,
      accent: data.overdueInspections > 0,
    },
    {
      title: "Lease renewals",
      description:
        data.leaseExpiring30Days > 0
          ? `${data.leaseExpiring30Days} lease${data.leaseExpiring30Days === 1 ? "" : "s"} expiring within 30 days${data.leaseExpiring60Days > 0 ? `, ${data.leaseExpiring60Days} more within 60 days` : ""}.`
          : data.leaseExpiring60Days > 0
            ? `${data.leaseExpiring60Days} lease${data.leaseExpiring60Days === 1 ? "" : "s"} expiring within 60 days.`
            : "No leases expiring in the next 60 days.",
      href: "/dashboard/org/leases",
      actionLabel: "Review leases",
      icon: FileText,
      accent: data.leaseExpiring30Days > 0,
    },
    {
      title: "Tax desk",
      description:
        data.pendingTaxCharges > 0
          ? `${data.pendingTaxCharges} pending tax charge${data.pendingTaxCharges === 1 ? "" : "s"} on file.`
          : "No pending tax obligations.",
      href: "/dashboard/org/taxes",
      actionLabel: "Open taxes",
      icon: Receipt,
      accent: data.pendingTaxCharges > 0,
    },
  ];

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-foreground">Operational snapshot</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          High-signal queues across finance, operations, and tenant lifecycle.
        </p>
      </div>

      <div className="space-y-3 p-5 sm:p-6">
        {signals.map((signal) => (
          <DeferredLink
            key={signal.title}
            href={signal.href}
            className={`group block rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${
              signal.accent
                ? "border-amber-200 bg-amber-50/70 hover:border-amber-300 dark:border-amber-500/30 dark:bg-amber-500/10"
                : "border-border bg-muted/10 hover:border-border/80 hover:bg-muted/15"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground">
                  <signal.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{signal.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {signal.description}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    {signal.actionLabel}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </div>
          </DeferredLink>
        ))}
      </div>
    </section>
  );
}