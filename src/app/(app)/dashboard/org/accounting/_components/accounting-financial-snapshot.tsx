import type { AccountingPageData } from "../_lib/types";
import { AccountingCashPosition } from "./accounting-cash-position";
import { AccountingControlAccounts } from "./accounting-control-accounts";
import { AccountingIncomeBreakdown } from "./accounting-income-breakdown";

export function AccountingFinancialSnapshot({ data }: { data: AccountingPageData }) {
  if (!data.summary) {
    return null;
  }

  return (
    <div className="space-y-5">
      <AccountingCashPosition data={data} />
      <div className="grid gap-5 xl:grid-cols-2">
        <AccountingIncomeBreakdown data={data} />
        <AccountingControlAccounts data={data} />
      </div>
    </div>
  );
}