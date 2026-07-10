import { StatCard } from "@/components/theme/ed-dashboard-shell";
import { CalendarDays, Droplets, ReceiptText, Waves } from "lucide-react";
import { formatMoney } from "@/app/(app)/dashboard/tenant/water-bills/_lib/helpers";
import type { WaterBillsTotals } from "@/app/(app)/dashboard/tenant/water-bills/_lib/types";

export function WaterBillsStats({ totals }: { totals: WaterBillsTotals }) {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:gap-4">
      <StatCard
        icon={<Droplets className="h-4 w-4" />}
        label="Total Billed"
        value={formatMoney(totals.totalBilled)}
      />
      <StatCard
        icon={<CalendarDays className="h-4 w-4" />}
        label="Outstanding"
        value={formatMoney(totals.outstanding)}
      />
      <StatCard
        icon={<ReceiptText className="h-4 w-4" />}
        label="Paid Bills"
        value={totals.paidCount}
      />
      <StatCard
        icon={<Waves className="h-4 w-4" />}
        label="Units Used"
        value={totals.totalUnitsUsed}
      />
    </section>
  );
}