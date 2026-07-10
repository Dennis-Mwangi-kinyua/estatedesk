import Link from "next/link";
import { Receipt } from "lucide-react";

export function ExpendituresEmptyState() {
  return (
    <div className="px-5 py-10 text-center sm:px-6 sm:py-12">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted/30">
        <Receipt className="h-7 w-7 text-muted-foreground" />
      </div>

      <h2 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
        No expenditures recorded yet
      </h2>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        Start logging property operating costs or tenant-linked expenses using the
        form above. Paid entries can post directly to your organization ledger.
      </p>

      <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-muted/10 p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Step 1
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">Describe the spend</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Add category, amount, date, payee, and reference details.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/10 p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Step 2
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">Set the scope</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Keep it organization-wide or link the cost to one tenant.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/10 p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Step 3
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">Post or recover</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Mark paid for ledger posting or chargeable for tenant recovery.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <Link
          href="/dashboard/org/accounting"
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-5 text-sm font-medium text-foreground transition hover:bg-muted/30"
        >
          Open accounting desk
        </Link>
      </div>
    </div>
  );
}