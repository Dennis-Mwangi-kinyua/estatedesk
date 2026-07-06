import Link from "next/link";
import { Receipt } from "lucide-react";

export function ChargesEmptyState() {
  return (
    <div className="px-5 py-10 text-center sm:px-6 sm:py-12">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted/30">
        <Receipt className="h-7 w-7 text-muted-foreground" />
      </div>

      <h2 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
        No rent charges yet
      </h2>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        There are no rent charges on record right now. Charges are created when
        active leases have billing periods issued or when payments allocate to rent.
      </p>

      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/dashboard/org/leases"
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          Review leases
        </Link>
        <Link
          href="/dashboard/org/payments"
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-5 text-sm font-medium text-foreground transition hover:bg-muted/30"
        >
          Open payments desk
        </Link>
      </div>

      <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-muted/10 p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Step 1
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">Confirm leases</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Each tenant needs an active lease with monthly rent and due day set.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/10 p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Step 2
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">Issue periods</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Billing periods become charges with due dates and opening balances.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/10 p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Step 3
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">Collect rent</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Verified payments reduce balances and update charge status here.
          </p>
        </div>
      </div>
    </div>
  );
}