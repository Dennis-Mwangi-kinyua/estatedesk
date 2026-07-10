import { StatCard } from "@/components/theme/ed-dashboard-shell";
import {
  BadgeCheck,
  Clock3,
  Droplets,
  ReceiptText,
  Trash2,
  Wallet,
  Wrench,
} from "lucide-react";
import { formatMoney } from "@/app/(app)/dashboard/tenant/payments/_lib/helpers";
import type { TenantPaymentsPageData } from "@/app/(app)/dashboard/tenant/payments/_lib/types";

export function PaymentsStats({ data }: { data: TenantPaymentsPageData }) {
  return (
    <>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:gap-4">
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Total Paid"
          value={formatMoney(data.totalPaid)}
        />
        <StatCard
          icon={<BadgeCheck className="h-4 w-4" />}
          label="Successful"
          value={data.successfulPayments.length}
        />
        <StatCard
          icon={<Clock3 className="h-4 w-4" />}
          label="Pending"
          value={data.pendingPayments.length}
        />
        <StatCard
          icon={<ReceiptText className="h-4 w-4" />}
          label="Verified"
          value={data.verifiedPayments.length}
        />
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:gap-4">
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Rent Paid"
          value={formatMoney(data.totalRentPaid)}
        />
        <StatCard
          icon={<Droplets className="h-4 w-4" />}
          label="Water Paid"
          value={formatMoney(data.totalWaterPaid)}
        />
        <StatCard
          icon={<Wrench className="h-4 w-4" />}
          label="Service Charge"
          value={formatMoney(data.totalServiceChargePaid)}
        />
        <StatCard
          icon={<Trash2 className="h-4 w-4" />}
          label="Garbage"
          value={formatMoney(data.totalGarbagePaid)}
        />
      </section>
    </>
  );
}