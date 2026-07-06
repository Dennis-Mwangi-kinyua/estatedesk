import { HandCoins } from "lucide-react";
import type { getTenantReceivablesReport } from "@/lib/accounting/receivables";
import { formatDate, formatMoney } from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";
import { panelShellClassName, SectionHeader, StatCard } from "./accounting-ui";

type ReceivablesData = Awaited<ReturnType<typeof getTenantReceivablesReport>> & {
  glReceivableBalance: number;
};

const BUCKET_LABELS = {
  current: "Current",
  "1-30": "1–30 days",
  "31-60": "31–60 days",
  "61-90": "61–90 days",
  "90+": "90+ days",
} as const;

export function AccountingReceivablesWorkspace({
  data,
  receivables,
}: {
  data: AccountingPageData;
  receivables: ReceivablesData;
}) {
  const { org } = data;

  return (
    <div className="space-y-5">
      <section className={panelShellClassName}>
        <SectionHeader
          icon={HandCoins}
          title="Accounts receivable"
          description="Outstanding tenant balances from rent charges and water bills, with GL receivables control balance."
        />

        <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
          <StatCard
            label="Operational AR"
            value={formatMoney(receivables.totalBalance, org.currencyCode)}
            highlight
          />
          <StatCard
            label="GL receivables"
            value={formatMoney(receivables.glReceivableBalance, org.currencyCode)}
          />
          <StatCard
            label="Open items"
            value={String(receivables.rows.length)}
          />
          <StatCard
            label="Recognition"
            value={data.settings.recognitionMode}
          />
        </div>
      </section>

      <section className={panelShellClassName}>
        <SectionHeader title="Aging summary" />
        <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 lg:grid-cols-5 sm:px-6">
          {(Object.keys(BUCKET_LABELS) as Array<keyof typeof BUCKET_LABELS>).map(
            (bucket) => (
              <StatCard
                key={bucket}
                label={BUCKET_LABELS[bucket]}
                value={formatMoney(receivables.bucketTotals[bucket], org.currencyCode)}
                compact
              />
            ),
          )}
        </div>
      </section>

      <section className={panelShellClassName}>
        <SectionHeader title="Outstanding balances" />
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/20 text-xs uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Tenant</th>
                <th className="px-5 py-3 font-semibold">Unit</th>
                <th className="px-5 py-3 font-semibold">Reference</th>
                <th className="px-5 py-3 font-semibold">Due</th>
                <th className="px-5 py-3 font-semibold">Balance</th>
                <th className="px-5 py-3 font-semibold">Aging</th>
                <th className="px-5 py-3 font-semibold">GL</th>
              </tr>
            </thead>
            <tbody>
              {receivables.rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-muted-foreground">
                    No outstanding tenant receivables.
                  </td>
                </tr>
              ) : (
                receivables.rows.map((row) => (
                  <tr key={`${row.source}-${row.reference}-${row.tenantId}`} className="border-b border-border/70">
                    <td className="px-5 py-3 font-medium text-foreground">{row.tenantName}</td>
                    <td className="px-5 py-3 text-muted-foreground">{row.unitLabel}</td>
                    <td className="px-5 py-3 text-muted-foreground">{row.reference}</td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDate(row.dueDate)}</td>
                    <td className="px-5 py-3 font-medium text-foreground">
                      {formatMoney(row.balance, org.currencyCode)}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {BUCKET_LABELS[row.bucket]}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          row.glPosted
                            ? "rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                            : "rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
                        }
                      >
                        {row.glPosted ? "Posted" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}