import type { OrgRole } from "@prisma/client";
import type { PaymentsPageData } from "../_lib/types";
import { PaymentsGuidance } from "./payments-guidance";
import { PaymentsHeader } from "./payments-header";
import { PaymentsLedgerSection } from "./payments-ledger-section";
import { PaymentsPendingSection } from "./payments-pending-section";
import { PaymentsRecentSection } from "./payments-recent-section";
import { PaymentsReconciliationSection } from "./payments-reconciliation-section";
import { PaymentsStatsSection } from "./payments-stats-section";

export function PaymentsWorkspace({
  data,
  orgRole,
}: {
  data: PaymentsPageData;
  orgRole?: OrgRole | null;
}) {
  const {
    ledger,
    q,
    pendingPayments,
    unreconciledCount,
    disputedCount,
    reconciledThisMonth,
    reconciliationQueue,
    periodParams,
  } = data;

  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <PaymentsHeader data={data} orgRole={orgRole} />
      <PaymentsStatsSection ledger={ledger} pendingPayments={pendingPayments} />

      <PaymentsReconciliationSection
        ledger={ledger}
        periodParams={periodParams}
        unreconciledCount={unreconciledCount}
        disputedCount={disputedCount}
        reconciledThisMonth={reconciledThisMonth}
        pendingPayments={pendingPayments}
        reconciliationQueue={reconciliationQueue}
      />

      <PaymentsPendingSection pendingPayments={pendingPayments} q={q} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <PaymentsLedgerSection ledger={ledger} />
          <PaymentsRecentSection ledger={ledger} />
        </div>
        <PaymentsGuidance orgRole={orgRole} />
      </div>
    </div>
  );
}