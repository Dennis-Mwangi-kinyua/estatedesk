import { formatCurrency } from "../_lib/helpers";
import type { ChargesPageData } from "../_lib/types";
import { StatCard } from "./charges-ui";

export function ChargesStats({ stats }: { stats: ChargesPageData["stats"] }) {
  return (
    <section className="workspace-card-grid grid min-w-0 grid-cols-1 gap-3 min-[380px]:grid-cols-2 xl:grid-cols-3">
      <StatCard label="Total charges" value={stats.totalCharges} />
      <StatCard label="Total amount due" value={formatCurrency(stats.totalAmountDue)} />
      <StatCard
        label="Unpaid"
        value={stats.unpaidCharges}
        highlight={stats.unpaidCharges > 0 ? "warning" : "default"}
        note="No payment recorded yet"
      />
      <StatCard
        label="Partial"
        value={stats.partialCharges}
        note="Some payment allocated"
      />
      <StatCard
        label="Paid"
        value={stats.paidCharges}
        highlight={stats.paidCharges > 0 ? "success" : "default"}
        note="Balance cleared"
      />
      <StatCard
        label="Outstanding balance"
        value={formatCurrency(stats.totalBalance)}
        note={
          stats.overdueCharges > 0
            ? `${stats.overdueCharges} overdue charge${stats.overdueCharges === 1 ? "" : "s"}`
            : "Remaining amount to collect"
        }
      />
    </section>
  );
}