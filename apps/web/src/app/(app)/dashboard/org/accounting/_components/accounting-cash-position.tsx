import { Banknote, Landmark, Smartphone, Wallet } from "lucide-react";
import { formatMoney } from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";
import { StatCard, panelShellClassName } from "./accounting-ui";

export function AccountingCashPosition({ data }: { data: AccountingPageData }) {
  const { org, summary, currentPeriod } = data;

  if (!summary) {
    return null;
  }

  const { controlBalances, cashTotal } = summary;

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Cash and bank position
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Liquid balances from posted journals across bank, M-Pesa, and cash accounts.
            </p>
          </div>
          {currentPeriod ? (
            <span className="inline-flex rounded-full border border-border bg-muted/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {currentPeriod.name} · {currentPeriod.status}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 xl:grid-cols-4 sm:px-6">
        <StatCard
          label="Total cash"
          value={formatMoney(cashTotal, org.currencyCode)}
          Icon={Wallet}
        />
        <StatCard
          label="Bank"
          value={formatMoney(controlBalances.bank, org.currencyCode)}
          Icon={Landmark}
        />
        <StatCard
          label="M-Pesa"
          value={formatMoney(controlBalances.mpesa, org.currencyCode)}
          Icon={Smartphone}
        />
        <StatCard
          label="Cash on hand"
          value={formatMoney(controlBalances.cash, org.currencyCode)}
          Icon={Banknote}
        />
      </div>
    </section>
  );
}