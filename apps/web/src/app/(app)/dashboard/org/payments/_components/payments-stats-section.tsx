import { formatLedgerCurrency } from "@/lib/ledger";
import { StatCard } from "./payments-ui";
import type { PaymentsPageData } from "../_lib/types";

export function PaymentsStatsSection({
  ledger,
  pendingPayments,
}: {
  ledger: PaymentsPageData["ledger"];
  pendingPayments: PaymentsPageData["pendingPayments"];
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Expected this month"
        value={formatLedgerCurrency(ledger.totals.expected)}
        note="Rent plus issued bills"
      />
      <StatCard
        label="Paid this month"
        value={formatLedgerCurrency(ledger.totals.paid)}
        highlight={ledger.totals.paid > 0 ? "success" : "default"}
        note={`${pendingPayments.length} payment${pendingPayments.length === 1 ? "" : "s"} awaiting verification`}
      />
      <StatCard
        label="Deficit"
        value={formatLedgerCurrency(ledger.totals.deficit)}
        highlight={ledger.totals.deficit > 0 ? "warning" : "default"}
        note={`${ledger.totals.partial} partial, ${ledger.totals.unpaid} unpaid`}
      />
      <StatCard
        label="Defaults"
        value={ledger.totals.defaulted}
        highlight={ledger.totals.defaulted > 0 ? "warning" : "default"}
        note="Balances over 5 days overdue"
      />
    </section>
  );
}