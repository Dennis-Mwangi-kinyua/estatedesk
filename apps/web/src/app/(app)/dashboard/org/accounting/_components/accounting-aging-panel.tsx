import Link from "next/link";
import { CalendarClock, HandCoins, Users } from "lucide-react";
import type { AgingSummary } from "@/lib/accounting/aging";
import {
  DataCard,
  DataCardRow,
  ResponsiveDataList,
} from "@/components/ui/responsive-data-list";
import { formatDate, formatMoney } from "../_lib/helpers";
import { panelShellClassName, SectionHeader } from "./accounting-ui";

function bucketTone(key: string) {
  if (key === "current") return "border-emerald-200 bg-emerald-50/80 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100";
  if (key === "d1_30") return "border-sky-200 bg-sky-50/80 text-sky-900 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-100";
  if (key === "d31_60") return "border-amber-200 bg-amber-50/80 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100";
  if (key === "d61_90") return "border-orange-200 bg-orange-50/80 text-orange-950 dark:border-orange-900/40 dark:bg-orange-950/30 dark:text-orange-100";
  return "border-rose-200 bg-rose-50/80 text-rose-950 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100";
}

function AgingBlock({
  title,
  description,
  icon: Icon,
  aging,
  currencyCode,
  emptyLabel,
  footerHref,
  footerLabel,
}: {
  title: string;
  description: string;
  icon: typeof Users;
  aging: AgingSummary;
  currencyCode: string;
  emptyLabel: string;
  footerHref: string;
  footerLabel: string;
}) {
  return (
    <section className={panelShellClassName}>
      <SectionHeader
        icon={Icon}
        title={title}
        description={description}
        action={
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Total open
            </p>
            <p className="text-base font-semibold text-foreground">
              {formatMoney(aging.total, currencyCode)}
            </p>
            {aging.overdueCount > 0 ? (
              <p className="mt-0.5 text-[11px] font-medium text-rose-700 dark:text-rose-300">
                {aging.overdueCount} overdue ·{" "}
                {formatMoney(aging.overdueTotal, currencyCode)}
              </p>
            ) : null}
          </div>
        }
      />

      <div className="flex gap-2 overflow-x-auto px-4 py-3 sm:px-6">
        {aging.buckets.map((bucket) => (
          <div
            key={bucket.key}
            className={`min-w-[6.5rem] shrink-0 rounded-2xl border px-3 py-2.5 ${bucketTone(bucket.key)}`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] opacity-80">
              {bucket.label}
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums">
              {formatMoney(bucket.amount, currencyCode)}
            </p>
            <p className="mt-0.5 text-[11px] opacity-80">{bucket.count} item(s)</p>
          </div>
        ))}
      </div>

      {aging.items.length === 0 ? (
        <p className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">
          {emptyLabel}
        </p>
      ) : (
        <ResponsiveDataList
          className="border-t border-border"
          mobile={
            <ul className="divide-y divide-border">
              {aging.items.slice(0, 6).map((item) => (
                <li key={item.id}>
                  <DataCard>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {item.party}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {item.reference}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                        {formatMoney(item.balance, currencyCode)}
                      </p>
                    </div>
                    <dl className="mt-2.5 space-y-1.5 rounded-xl border border-border bg-muted/20 p-2.5">
                      <DataCardRow
                        label="Due"
                        value={formatDate(item.dueDate ?? "")}
                      />
                      <DataCardRow
                        label="Days past due"
                        value={
                          item.daysPastDue > 0
                            ? String(item.daysPastDue)
                            : "Current"
                        }
                      />
                    </dl>
                  </DataCard>
                </li>
              ))}
            </ul>
          }
          desktop={
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-muted/20">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Party
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Due
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    DPD
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {aging.items.slice(0, 8).map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/70 transition hover:bg-muted/10"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {item.party}
                    </td>
                    <td className="max-w-[16rem] truncate px-4 py-3 text-muted-foreground">
                      {item.reference}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(item.dueDate ?? "")}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.daysPastDue > 0 ? item.daysPastDue : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
                      {formatMoney(item.balance, currencyCode)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        />
      )}

      <div className="border-t border-border px-4 py-3 sm:px-6">
        <Link
          href={footerHref}
          className="text-sm font-semibold text-primary hover:text-primary/80"
        >
          {footerLabel}
        </Link>
      </div>
    </section>
  );
}

export function AccountingAgingPanel({
  arAging,
  apAging,
  currencyCode,
}: {
  arAging: AgingSummary;
  apAging: AgingSummary;
  currencyCode: string;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 px-0.5">
        <CalendarClock className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">
          Receivables & payables aging
        </h2>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <AgingBlock
          title="Accounts receivable"
          description="Open tenant charges by days past due — collection priority for bookkeepers."
          icon={Users}
          aging={arAging}
          currencyCode={currencyCode}
          emptyLabel="No open tenant balances. Collections are current."
          footerHref="/dashboard/org/accounting/receivables"
          footerLabel="Open receivables workspace →"
        />
        <AgingBlock
          title="Accounts payable"
          description="Approved vendor bills by due date — cash-out forecasting."
          icon={HandCoins}
          aging={apAging}
          currencyCode={currencyCode}
          emptyLabel="No open vendor bills awaiting payment."
          footerHref="/dashboard/org/accounting?tab=payables"
          footerLabel="Open payables desk →"
        />
      </div>
    </div>
  );
}
