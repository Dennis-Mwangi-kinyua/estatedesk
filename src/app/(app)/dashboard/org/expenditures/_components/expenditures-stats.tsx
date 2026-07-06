import { formatMoney } from "../_lib/helpers";
import type { OrgExpendituresPageData } from "../_lib/types";
import { StatCard } from "./expenditures-ui";

export function ExpendituresStats({ data }: { data: OrgExpendituresPageData }) {
  const {
    org,
    recordedTotal,
    organizationScopeCount,
    tenantScopeCount,
    pendingApprovalCount,
    approvedAwaitingPaymentCount,
    totalExpenditures,
  } = data;

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <StatCard
        label="Recorded total"
        value={formatMoney(recordedTotal, org.currencyCode)}
        note="Excludes voided entries"
      />
      <StatCard
        label="Organization costs"
        value={organizationScopeCount}
        note="Portfolio-level operating spend"
      />
      <StatCard
        label="Tenant-linked costs"
        value={tenantScopeCount}
        note="Recoverable or tenant-visible costs"
      />
      <StatCard
        label="Pending approval"
        value={pendingApprovalCount}
        note="Awaiting accounts review"
        highlight={pendingApprovalCount > 0 ? "warning" : "default"}
      />
      <StatCard
        label="Approved awaiting payment"
        value={approvedAwaitingPaymentCount}
        note="Ready to post to ledger"
        highlight={approvedAwaitingPaymentCount > 0 ? "warning" : "default"}
      />
      <StatCard
        label="Entries logged"
        value={totalExpenditures}
        note="All expenditure records"
      />
    </section>
  );
}