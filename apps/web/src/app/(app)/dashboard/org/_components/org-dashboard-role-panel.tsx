import type { OrgRole } from "@prisma/client";
import { DeferredLink } from "@/components/navigation/app-links";
import type { OrgDashboardSummary } from "@/features/dashboard/server/get-org-dashboard-summary";
import { panelShellClassName } from "./org-dashboard-ui";

type RoleAction = {
  title: string;
  description: string;
  href: string;
  accent?: boolean;
};

function getRoleActions(
  role: OrgRole | null | undefined,
  data: OrgDashboardSummary,
): RoleAction[] {
  switch (role) {
    case "ACCOUNTANT":
      return [
        {
          title: "Finance request desk",
          description:
            data.pendingFinanceRequests > 0
              ? `${data.pendingFinanceRequests} ticket${data.pendingFinanceRequests === 1 ? "" : "s"} waiting for review.`
              : "Review worker spend tickets and post approved items.",
          href: "/dashboard/org/accounting/requests",
          accent: data.pendingFinanceRequests > 0,
        },
        {
          title: "Expenditure approvals",
          description:
            data.expenditureApprovalsPending > 0
              ? `${data.expenditureApprovalsPending} spend record${data.expenditureApprovalsPending === 1 ? "" : "s"} need approval.`
              : "Approve or reject submitted organization costs.",
          href: "/dashboard/org/expenditures",
          accent: data.expenditureApprovalsPending > 0,
        },
        {
          title: "Accounting workspace",
          description: !data.accountingInitialized
            ? "Initialize chart of accounts and fiscal periods."
            : data.openPayables > 0
              ? `${data.openPayables} open payable${data.openPayables === 1 ? "" : "s"} to settle.`
              : "Post entries, sync payments, and review trial balance.",
          href: "/dashboard/org/accounting",
          accent: !data.accountingInitialized || data.openPayables > 0,
        },
        {
          title: "Payment verification",
          description:
            data.pendingPayments > 0
              ? `${data.pendingPayments} payment${data.pendingPayments === 1 ? "" : "s"} awaiting verification.`
              : "Reconcile tenant collections against the ledger.",
          href: "/dashboard/org/payments",
          accent: data.pendingPayments > 0,
        },
      ];
    case "MANAGER":
    case "ADMIN":
      return [
        {
          title: "Operational insights",
          description: "Ranked actions from portfolio, billing, and maintenance signals.",
          href: "/dashboard/org/insights",
        },
        {
          title: "Finance requests",
          description:
            data.pendingFinanceRequests > 0
              ? `${data.pendingFinanceRequests} ticket${data.pendingFinanceRequests === 1 ? "" : "s"} in the accounts queue.`
              : "Submit or track worker spend tickets.",
          href: "/dashboard/org/finance-requests",
          accent: data.pendingFinanceRequests > 0,
        },
        {
          title: "Lease renewals",
          description:
            data.leaseExpiring30Days > 0
              ? `${data.leaseExpiring30Days} lease${data.leaseExpiring30Days === 1 ? "" : "s"} expiring within 30 days.`
              : "Review active leases and renewal windows.",
          href: "/dashboard/org/leases",
          accent: data.leaseExpiring30Days > 0,
        },
        {
          title: "Move-out pipeline",
          description:
            data.moveOutQueueCount > 0
              ? `${data.moveOutQueueCount} active move-out${data.moveOutQueueCount === 1 ? "" : "s"} in progress.`
              : "Schedule inspections and close notices.",
          href: "/dashboard/org/move-outs",
          accent: data.moveOutQueueCount > 0,
        },
      ];
    case "OFFICE":
      return [
        {
          title: "Tenant onboarding",
          description: "Create tenant records, assign units, and activate leases.",
          href: "/dashboard/org/tenants/new",
        },
        {
          title: "Vacancy inquiries",
          description:
            data.vacancyInquiries > 0
              ? `${data.vacancyInquiries} new lead${data.vacancyInquiries === 1 ? "" : "s"} to follow up.`
              : "Respond to public vacancy enquiries.",
          href: "/dashboard/org/vacancy-inquiries",
          accent: data.vacancyInquiries > 0,
        },
        {
          title: "Finance requests",
          description: "Submit reimbursement or vendor payment tickets to accounts.",
          href: "/dashboard/org/finance-requests",
        },
        {
          title: "Water approvals",
          description:
            data.waterPendingApproval > 0
              ? `${data.waterPendingApproval} reading${data.waterPendingApproval === 1 ? "" : "s"} awaiting approval.`
              : "Verify caretaker meter readings before billing.",
          href: "/dashboard/org/water-bills",
          accent: data.waterPendingApproval > 0,
        },
        {
          title: "Completion reports",
          description:
            data.pendingResolutionReports > 0
              ? `${data.pendingResolutionReports} caretaker report${data.pendingResolutionReports === 1 ? "" : "s"} awaiting review.`
              : "Review caretaker work before tenant confirmation.",
          href: "/dashboard/org/issues/resolution-reports",
          accent: data.pendingResolutionReports > 0,
        },
        {
          title: "Issue follow-up",
          description:
            data.openIssues > 0
              ? `${data.openIssues} open maintenance issue${data.openIssues === 1 ? "" : "s"}.`
              : "Track repairs and caretaker assignments.",
          href: "/dashboard/org/issues",
          accent: data.urgentIssues > 0,
        },
      ];
    default:
      return [
        {
          title: "Smart insights",
          description: "Review ranked portfolio actions and exceptions.",
          href: "/dashboard/org/insights",
        },
        {
          title: "Payments desk",
          description: "Verify collections and tenant balances.",
          href: "/dashboard/org/payments",
        },
      ];
  }
}

export function OrgDashboardRolePanel({
  data,
  orgRole,
}: {
  data: OrgDashboardSummary;
  orgRole?: OrgRole | null;
}) {
  const actions = getRoleActions(orgRole, data);
  const roleLabel = orgRole
    ? orgRole.charAt(0) + orgRole.slice(1).toLowerCase()
    : "Staff";

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-foreground">
          {roleLabel} workspace
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Shortcuts and queues scoped to your role in this organization.
        </p>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
        {actions.map((action) => (
          <DeferredLink
            key={action.title}
            href={action.href}
            className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${
              action.accent
                ? "border-amber-200 bg-amber-50/70 hover:border-amber-300 dark:border-amber-500/30 dark:bg-amber-500/10"
                : "border-border bg-muted/10 hover:border-border/80 hover:bg-muted/15"
            }`}
          >
            <p className="text-sm font-semibold text-foreground">{action.title}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {action.description}
            </p>
            <span className="mt-3 inline-flex text-sm font-medium text-primary">
              Open workspace
            </span>
          </DeferredLink>
        ))}
      </div>
    </section>
  );
}