import Link from "next/link";
import { WalletCards } from "lucide-react";
import { formatDate, formatMoney } from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";
export function AccountingRecentSection({ data }: { data: AccountingPageData }) {
  const { org, journals, bills } = data;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-muted/5 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            <WalletCards className="h-5 w-5 text-primary" />
            Recent journals
          </h2>
          <Link
            href="/dashboard/org/accounting/journals"
            className="text-sm font-semibold text-primary hover:text-primary/80"
          >
            Open register
          </Link>
        </div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Latest posted journal entries across payments, expenses, and manual adjustments.
        </p>

        <div className="mt-5 space-y-3">
          {journals.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground">
              No journal entries posted yet.
            </p>
          ) : (
            journals.map((journal) => (
              <div
                key={journal.id}
                className="rounded-2xl border border-border bg-muted/10 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-4 text-sm font-semibold text-foreground">
                  <span>{journal.description}</span>
                  <span className="text-muted-foreground">{journal.entryNumber}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(journal.entryDate)} · {journal.status} · {journal.sourceType}
                </p>
                {journal.lines.length > 0 ? (
                  <div className="mt-3 space-y-1 border-t border-border/70 pt-3">
                    {journal.lines.map((line) => (
                      <div
                        key={line.id}
                        className="flex items-center justify-between gap-4 text-xs text-muted-foreground"
                      >
                        <span>
                          {line.account.code} · {line.account.name}
                        </span>
                        <span className="font-medium text-foreground">
                          {Number(line.debit) > 0
                            ? `DR ${formatMoney(Number(line.debit), org.currencyCode)}`
                            : `CR ${formatMoney(Number(line.credit), org.currencyCode)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-muted/5 p-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Vendor bills and expenses
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Paid vendor bills created from the expense posting workflow.
        </p>

        <div className="mt-5 space-y-3">
          {bills.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground">
              No vendor bills recorded yet.
            </p>
          ) : (
            bills.map((bill) => (
              <div
                key={bill.id}
                className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-muted/10 px-4 py-3 text-sm"
              >
                <span>
                  <span className="font-semibold text-foreground">{bill.vendor.name}</span>
                  <span className="mt-1 block text-muted-foreground">
                    {bill.billNumber} · {bill.status}
                  </span>
                </span>
                <span className="font-semibold text-foreground">
                  {formatMoney(Number(bill.total), bill.currencyCode)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}