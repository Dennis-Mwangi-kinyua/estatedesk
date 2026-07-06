import {
  AlertTriangle,
  BadgeCheck,
  Receipt,
  Star,
  TrendingUp,
} from "lucide-react";
import { formatLedgerCurrency } from "@/lib/ledger";
import type { ReportsPageData } from "../_lib/types";
import { ReportStat } from "./reports-ui";

export function ReportsStatsSection({ data }: { data: ReportsPageData }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <ReportStat
        icon={Receipt}
        label="Expected"
        value={formatLedgerCurrency(data.scopedTotals.expected)}
      />
      <ReportStat
        icon={TrendingUp}
        label="Paid"
        value={formatLedgerCurrency(data.scopedTotals.paid)}
      />
      <ReportStat
        icon={AlertTriangle}
        label="Outstanding"
        value={formatLedgerCurrency(data.scopedTotals.deficit)}
        highlight={data.scopedTotals.deficit > 0}
      />
      <ReportStat
        icon={BadgeCheck}
        label="Paid tenants"
        value={data.paidRows.length.toLocaleString()}
      />
      <ReportStat
        icon={Star}
        label="Occupants in scope"
        value={data.filteredRows.length.toLocaleString()}
      />
    </section>
  );
}