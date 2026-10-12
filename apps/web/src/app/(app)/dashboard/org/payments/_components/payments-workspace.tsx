import type { ReactNode } from "react";
import { RecordCashPaymentForm } from "./record-cash-payment-form";
import { roleHasOrgPermission } from "@/lib/permissions/role-matrix";
import { nairobiDate } from "@/lib/move-outs/validation";
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
  recordPayment,
}: {
  data: PaymentsPageData;
  recordPayment?: ReactNode;
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
    <div className="org-theme-content mx-auto w-full min-w-0 max-w-7xl space-y-5 px-0 pb-24 pt-2 sm:space-y-6 sm:px-2">
      <style>{`
        @media (max-width: 1279px) {
          .payments-responsive-table,
          .payments-responsive-table tbody {
            display: block;
            width: 100%;
          }
          .payments-responsive-table tbody {
            display: grid;
            gap: 1rem;
            padding: 1rem;
          }

          .payments-responsive-table thead {
            display: none;
          }

          .payments-responsive-table tr {
            display: block;
            margin: 0;
            overflow: hidden;
            border: 1px solid var(--border);
            border-radius: 1rem;
            background: var(--card);
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
        @media (min-width: 768px) and (max-width: 1279px) {
          .payments-responsive-table tbody { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
      `}</style>
      <PaymentsHeader data={data} orgRole={orgRole} />
      <PaymentsStatsSection ledger={ledger} pendingPayments={pendingPayments} />
      {recordPayment}

      <PaymentsReconciliationSection
        ledger={ledger}
        periodParams={periodParams}
        unreconciledCount={unreconciledCount}
        disputedCount={disputedCount}
        reconciledThisMonth={reconciledThisMonth}
        pendingPayments={pendingPayments}
        reconciliationQueue={reconciliationQueue}
      />

      {roleHasOrgPermission(orgRole, "payments.record") ? <RecordCashPaymentForm leases={data.cashLeases} period={ledger.period} dateLimit={nairobiDate()} /> : null}

      <PaymentsPendingSection pendingPayments={pendingPayments} q={q} />

      <PaymentsLedgerSection ledger={ledger} />
      <PaymentsRecentSection ledger={ledger} />
      <PaymentsGuidance orgRole={orgRole} />
    </div>
  );
}
