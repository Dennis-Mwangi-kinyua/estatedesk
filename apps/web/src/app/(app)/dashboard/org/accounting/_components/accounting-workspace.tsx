import type { OrgRole } from "@prisma/client";
import { AccountingRequestsQueue } from "@/features/accounting-requests/components/accounting-requests-queue";
import type { AccountingRequestsQueueData } from "@/features/accounting-requests/_lib/types";
import {
  parseAccountingEntryType,
  parseAccountingTab,
} from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";
import { AccountingChartOfAccounts } from "./accounting-chart-of-accounts";
import { AccountingExpenseForm } from "./accounting-expense-form";
import { AccountingFinancialSnapshot } from "./accounting-financial-snapshot";
import { AccountingGuidance } from "./accounting-guidance";
import { AccountingHeader } from "./accounting-header";
import { AccountingJournalForm } from "./accounting-journal-form";
import { AccountingPayablesSection } from "./accounting-payables-section";
import { AccountingPostEntriesShell } from "./accounting-post-entries-shell";
import { AccountingRecentSection } from "./accounting-recent-section";
import { AccountingSyncPayments } from "./accounting-sync-payments";
import { AccountingTabShell } from "./accounting-tab-shell";
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
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <AccountingSubNav />
      <AccountingHeader
        data={data}
        message={message}
        orgRole={orgRole}
        pendingRequests={requestsQueue.pendingCount}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-5">
          <AccountingFinancialSnapshot data={data} />

          <AccountingTabShell
            activeTab={tab}
            operations={
              <div className="space-y-5">
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
              <div className="grid gap-5 xl:grid-cols-2">
                <AccountingVendorForm data={data} />
                <AccountingPayablesSection data={data} />
              </div>
            }
            ledger={
              <div className="space-y-5">
                <AccountingRecentSection data={data} />
                <AccountingTrialBalance data={data} />
                <AccountingChartOfAccounts data={data} />
              </div>
            }
          />
        </div>

        <AccountingGuidance orgRole={orgRole} />
      </div>
    </div>
  );
}