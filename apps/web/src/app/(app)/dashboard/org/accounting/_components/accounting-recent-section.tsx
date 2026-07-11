import Link from "next/link";
import { WalletCards } from "lucide-react";
import {
  DataCard,
  DataCardRow,
  ResponsiveDataList,
} from "@/components/ui/responsive-data-list";
import { formatDate, formatMoney } from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";
import { panelShellClassName, SectionHeader } from "./accounting-ui";

export function AccountingRecentSection({ data }: { data: AccountingPageData }) {
  const { org, journals, bills } = data;

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className={panelShellClassName}>
        <SectionHeader
          icon={WalletCards}
          title="Recent journals"
          description="Latest posted entries across payments, expenses, and adjustments."
          action={
            <Link
              href="/dashboard/org/accounting/journals"
              className="text-sm font-semibold text-primary hover:text-primary/80"
            >
              Full register
            </Link>
          }
        />

        {journals.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">
            No journal entries posted yet.
          </p>
        ) : (
          <ResponsiveDataList
            mobile={
              <ul className="divide-y divide-border">
                {journals.map((journal) => {
                  const totalDebit = journal.lines.reduce(
                    (s, line) => s + Number(line.debit),
                    0,
                  );
                  return (
                    <li key={journal.id}>
                      <DataCard>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">
                              {journal.description}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {journal.entryNumber} · {formatDate(journal.entryDate)}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold tabular-nums">
                            {formatMoney(totalDebit, org.currencyCode)}
                          </p>
                        </div>
                        <dl className="mt-2.5 space-y-1.5 rounded-xl border border-border bg-muted/20 p-2.5">
                          <DataCardRow label="Status" value={journal.status} />
                          <DataCardRow label="Source" value={journal.sourceType} />
                          {journal.lines.slice(0, 2).map((line) => (
                            <DataCardRow
                              key={line.id}
                              label={`${line.account.code}`}
                              value={
                                Number(line.debit) > 0
                                  ? `DR ${formatMoney(Number(line.debit), org.currencyCode)}`
                                  : `CR ${formatMoney(Number(line.credit), org.currencyCode)}`
                              }
                            />
                          ))}
                        </dl>
                      </DataCard>
                    </li>
                  );
                })}
              </ul>
            }
            desktop={
              <table className="min-w-full text-sm">
                <thead className="border-b border-border bg-muted/20">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Entry
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Date
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Source
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {journals.map((journal) => {
                    const totalDebit = journal.lines.reduce(
                      (s, line) => s + Number(line.debit),
                      0,
                    );
                    return (
                      <tr
                        key={journal.id}
                        className="border-b border-border/70 transition hover:bg-muted/10"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">
                            {journal.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {journal.entryNumber} · {journal.status}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(journal.entryDate)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {journal.sourceType}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
                          {formatMoney(totalDebit, org.currencyCode)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            }
          />
        )}
      </section>

      <section className={panelShellClassName}>
        <SectionHeader
          title="Vendor bills & expenses"
          description="Recent bills from the expense and accrual workflows."
        />

        {bills.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">
            No vendor bills recorded yet.
          </p>
        ) : (
          <ResponsiveDataList
            mobile={
              <ul className="divide-y divide-border">
                {bills.map((bill) => (
                  <li key={bill.id}>
                    <DataCard>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            {bill.vendor.name}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {bill.billNumber} · {bill.status}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold tabular-nums">
                          {formatMoney(Number(bill.total), bill.currencyCode)}
                        </p>
                      </div>
                      <dl className="mt-2.5 space-y-1.5 rounded-xl border border-border bg-muted/20 p-2.5">
                        <DataCardRow
                          label="Bill date"
                          value={formatDate(bill.billDate)}
                        />
                        <DataCardRow
                          label="Due"
                          value={formatDate(bill.dueDate)}
                        />
                        <DataCardRow
                          label="Paid"
                          value={formatMoney(
                            Number(bill.amountPaid),
                            bill.currencyCode,
                          )}
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
                      Vendor
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Bill
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr
                      key={bill.id}
                      className="border-b border-border/70 transition hover:bg-muted/10"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {bill.vendor.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {bill.billNumber}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {bill.status}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {formatMoney(Number(bill.total), bill.currencyCode)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          />
        )}
      </section>
    </div>
  );
}
