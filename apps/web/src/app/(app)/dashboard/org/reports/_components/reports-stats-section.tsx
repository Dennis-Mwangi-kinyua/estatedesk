import { AlertTriangle, BadgeCheck, Receipt, TrendingUp } from "lucide-react";
import { UsersRound as Users } from "@/components/shared/colored-icons";
import { formatLedgerCurrency } from "@/lib/ledger";
import type { ReportsPageData } from "../_lib/types";
import { ReportStat } from "./reports-ui";

export function ReportsStatsSection({ data }: { data: ReportsPageData }) {
  return (
    <section className="grid min-w-0 grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-6 [&>*]:h-full xl:[&>*:nth-child(-n+3)]:col-span-2 xl:[&>*:nth-child(n+4)]:col-span-3">
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
        icon={Users}
        label="Occupants in scope"
        value={data.filteredRows.length.toLocaleString()}
      />
    </section>
  );
}