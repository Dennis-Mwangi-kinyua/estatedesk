import { Building2, HandCoins, Receipt, Scale, Users } from "lucide-react";
import { formatMoney } from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";
import { StatCard, panelShellClassName } from "./accounting-ui";

export function AccountingControlAccounts({ data }: { data: AccountingPageData }) {
  const { org, summary } = data;

  if (!summary) {
    return null;
  }

  const { controlBalances, liabilities, equity } = summary;

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Control accounts
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Receivables, payables, deposits, and balance sheet controls for month-end
          review.
        </p>
      </div>

      <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 sm:px-6">
        <StatCard
          label="Tenant receivables"
          value={formatMoney(controlBalances.receivables, org.currencyCode)}
          Icon={Users}
          compact
        />
        <StatCard
          label="Accounts payable"
          value={formatMoney(controlBalances.payables, org.currencyCode)}
          Icon={Receipt}
          compact
        />
        <StatCard
          label="Deposits held"
          value={formatMoney(controlBalances.deposits, org.currencyCode)}
          Icon={HandCoins}
          compact
        />
        <StatCard
          label="Tax payable"
          value={formatMoney(controlBalances.taxPayable, org.currencyCode)}
          Icon={Scale}
          compact
        />
        <StatCard
          label="Total liabilities"
          value={formatMoney(liabilities, org.currencyCode)}
          Icon={Building2}
          compact
        />
        <StatCard
          label="Equity"
          value={formatMoney(equity, org.currencyCode)}
          Icon={Building2}
          compact
        />
      </div>
    </section>
  );
}