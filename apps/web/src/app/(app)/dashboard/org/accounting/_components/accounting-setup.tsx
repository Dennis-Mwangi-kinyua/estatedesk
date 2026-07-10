import Link from "next/link";
import { BookOpen } from "lucide-react";
import { initializeAccountingAction } from "../actions";
import { ACCOUNTING_WORKFLOW_STEPS } from "../_lib/constants";
import { buttonPrimaryClassName, buttonSecondaryClassName } from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";
import { panelShellClassName } from "./accounting-ui";

export function AccountingSetup({ data }: { data: AccountingPageData }) {
  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <section className={panelShellClassName}>
        <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            Double-entry general ledger
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Set up accounting
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            Create the chart of accounts and current fiscal period for {data.org.name}.
            Existing verified payments will post automatically once the ledger is initialized.
          </p>
        </div>

        <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
          {ACCOUNTING_WORKFLOW_STEPS.map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-border bg-muted/15 p-4"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {item.step}
                </span>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-border px-5 py-6 sm:px-6">
          <form action={initializeAccountingAction}>
            <button type="submit" className={buttonPrimaryClassName}>
              Initialize accounting ledger
            </button>
          </form>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            This creates your default accounts, opens the fiscal period, and imports
            verified payments into the books.
          </p>
        </div>
      </section>

      <section className={`${panelShellClassName} p-5 sm:p-6`}>
        <h2 className="text-lg font-semibold text-foreground">Before you start</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
          <li>Confirm your organization currency is set to {data.org.currencyCode}.</li>
          <li>Review verified tenant payments so they can post into the ledger.</li>
          <li>Prepare vendor and expense account names you use in daily operations.</li>
        </ul>
        <Link href="/dashboard/org/payments" className={`${buttonSecondaryClassName} mt-5`}>
          Review payments desk
        </Link>
      </section>
    </div>
  );
}