import type { OrgRole } from "@prisma/client";
import { AccountingRequestsQueue } from "@/features/accounting-requests/components/accounting-requests-queue";
import type { AccountingRequestsQueueData } from "@/features/accounting-requests/_lib/types";
import {
  parseAccountingEntryType,
  parseAccountingTab,
} from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";
import { AccountingAgingPanel } from "./accounting-aging-panel";
import { AccountingBooksHealth } from "./accounting-books-health";
import { AccountingChartOfAccounts } from "./accounting-chart-of-accounts";
import { AccountingExpenseForm } from "./accounting-expense-form";
import { AccountingFinancialSnapshot } from "./accounting-financial-snapshot";
import { AccountingGuidance } from "./accounting-guidance";
import { AccountingHeader } from "./accounting-header";
import { AccountingJournalForm } from "./accounting-journal-form";
import { AccountingKpiStrip } from "./accounting-kpi-strip";
import { AccountingPayablesSection } from "./accounting-payables-section";
import { AccountingPostEntriesShell } from "./accounting-post-entries-shell";
import { AccountingQuickActions } from "./accounting-quick-actions";
import { AccountingRecentSection } from "./accounting-recent-section";
import { AccountingSyncPayments } from "./accounting-sync-payments";
import { AccountingTabShell } from "./accounting-tab-shell";
import { AccountingTopExpenses } from "./accounting-top-expenses";
import { AccountingTrialBalance } from "./accounting-trial-balance";
import { AccountingSubNav } from "./accounting-sub-nav";
import { AccountingVendorBillForm } from "./accounting-vendor-bill-form";
import { AccountingVendorForm } from "./accounting-vendor-form";

export function AccountingWorkspace({
  data,
  requestsQueue,
  orgRole,
  message,
  activeTab,
  activeEntry,
}: {
  data: AccountingPageData;
  requestsQueue: AccountingRequestsQueueData;
  orgRole?: OrgRole | null;
  message?: string;
  activeTab?: string;
  activeEntry?: string;
}) {
  const tab = parseAccountingTab(activeTab);
  const entry = parseAccountingEntryType(activeEntry);

  return (
    <div className="org-theme-content ed-mobile-first mx-auto w-full max-w-7xl space-y-4 px-3 pb-8 pt-3 sm:space-y-6 sm:px-6 sm:pb-12 sm:pt-4 lg:px-8">
      <AccountingSubNav />
      <AccountingHeader
        data={data}
        message={message}
        orgRole={orgRole}
        pendingRequests={requestsQueue.pendingCount}
      />

      <AccountingKpiStrip data={data} />
      <AccountingQuickActions />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-5">
        <div className="min-w-0 space-y-4 sm:space-y-5">
          <AccountingBooksHealth data={data} />
          <AccountingFinancialSnapshot data={data} />
          <AccountingAgingPanel
            arAging={data.arAging}
            apAging={data.apAging}
            currencyCode={data.org.currencyCode}
          />
          <AccountingTopExpenses data={data} />

          <AccountingTabShell
            activeTab={tab}
            operations={
              <div className="space-y-4 sm:space-y-5">
                <AccountingSyncPayments data={data} />
                <AccountingRequestsQueue data={requestsQueue} />
              </div>
            }
            transactions={
              <AccountingPostEntriesShell
                activeEntry={entry}
                expense={<AccountingExpenseForm data={data} />}
                bill={<AccountingVendorBillForm data={data} />}
                journal={<AccountingJournalForm />}
              />
            }
            payables={
              <div className="grid gap-4 xl:grid-cols-2 xl:gap-5">
                <AccountingVendorForm data={data} />
                <AccountingPayablesSection data={data} />
              </div>
            }
            ledger={
              <div className="space-y-4 sm:space-y-5">
                <AccountingRecentSection data={data} />
                <AccountingTrialBalance data={data} />
                <AccountingChartOfAccounts data={data} />
              </div>
            }
          />
        </div>

        <div className="min-w-0 lg:block">
          <AccountingGuidance orgRole={orgRole} />
        </div>
      </div>
    </div>
  );
}
