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
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-5 px-3 pb-24 pt-3 sm:space-y-6 sm:px-6 sm:pt-4 lg:px-8">
      <style>{`
        @media (max-width: 639px) {
          .payments-responsive-table,
          .payments-responsive-table tbody {
            display: block;
            width: 100%;
          }

          .payments-responsive-table thead {
            display: none;
          }

          .payments-responsive-table tr {
            display: block;
            margin: 0.75rem;
            overflow: hidden;
            border: 1px solid var(--border);
            border-radius: 1rem;
            background: var(--background);
          }

          .payments-responsive-table td {
            display: flex;
            width: 100%;
            min-width: 0 !important;
            align-items: flex-start;
            justify-content: space-between;
            gap: 1rem;
            padding: 0.65rem 0.8rem;
            border-bottom: 1px solid color-mix(in oklab, var(--border) 65%, transparent);
            text-align: right;
            overflow-wrap: anywhere;
          }

          .payments-responsive-table td::before {
            content: attr(data-label);
            flex: 0 0 5.75rem;
            text-align: left;
            font-size: 0.68rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--muted-foreground);
          }

          .payments-responsive-table td:last-child {
            border-bottom: 0;
          }

          .payments-responsive-table td[data-mobile-block="true"] {
            display: block;
            text-align: left;
          }

          .payments-responsive-table td[data-mobile-block="true"]::before {
            display: block;
            margin-bottom: 0.6rem;
          }

          .payments-responsive-table .payments-empty-cell {
            display: block;
            text-align: center;
          }

          .payments-responsive-table .payments-empty-cell::before {
            display: none;
          }
        }
      `}</style>
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
