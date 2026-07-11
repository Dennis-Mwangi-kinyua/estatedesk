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
      <div className="border-b border-border px-4 py-3.5 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
              Cash and bank position
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
              Liquid balances from posted journals — bank, M-Pesa, and cash.
            </p>
          </div>
          {currentPeriod ? (
            <span className="inline-flex w-fit rounded-full border border-border bg-muted/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-xs">
              {currentPeriod.name} · {currentPeriod.status}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex gap-2.5 overflow-x-auto px-4 py-4 snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-6 xl:grid-cols-4">
        <div className="min-w-[9.5rem] shrink-0 snap-start sm:min-w-0">
          <StatCard
            label="Total cash"
            value={formatMoney(cashTotal, org.currencyCode)}
            Icon={Wallet}
            compact
            highlight
          />
        </div>
        <div className="min-w-[9.5rem] shrink-0 snap-start sm:min-w-0">
          <StatCard
            label="Bank"
            value={formatMoney(controlBalances.bank, org.currencyCode)}
            Icon={Landmark}
            compact
          />
        </div>
        <div className="min-w-[9.5rem] shrink-0 snap-start sm:min-w-0">
          <StatCard
            label="M-Pesa"
            value={formatMoney(controlBalances.mpesa, org.currencyCode)}
            Icon={Smartphone}
            compact
          />
        </div>
        <div className="min-w-[9.5rem] shrink-0 snap-start sm:min-w-0">
          <StatCard
            label="Cash on hand"
            value={formatMoney(controlBalances.cash, org.currencyCode)}
            Icon={Banknote}
            compact
          />
        </div>
      </div>
    </section>
  );
}